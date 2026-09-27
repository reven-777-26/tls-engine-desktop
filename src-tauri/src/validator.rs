use std::net::IpAddr;
use url::Url;

/// Sanitizes and validates a user-provided host input.
/// Strips out schemes, paths, query parameters, trailing slashes, and ports.
/// Returns a clean, normalized lowercase hostname/domain or IP.
pub fn sanitize_and_validate_host(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Hostname cannot be empty".to_string());
    }

    // Reject dangerous characters or injection attempts early
    if trimmed.contains('\0')
        || trimmed.contains(' ')
        || trimmed.contains('\'')
        || trimmed.contains('"')
        || trimmed.contains(';')
        || trimmed.contains('\\')
    {
        return Err("Hostname contains invalid or dangerous characters".to_string());
    }

    // If user provided a URL like https://example.com/path, parse via Url
    let candidate = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        match Url::parse(trimmed) {
            Ok(url) => url.host_str().map(|h| h.to_lowercase()).ok_or_else(|| {
                "Could not extract hostname from URL".to_string()
            })?,
            Err(_) => return Err("Invalid URL format".to_string()),
        }
    } else if trimmed.contains("://") {
        return Err("Only standard HTTP/HTTPS schemes or raw hostnames are supported".to_string());
    } else {
        // Strip any accidental path, query, or fragment if user pasted domain/path
        let host_part = trimmed.split(&['/', '?', '#'][..]).next().unwrap_or(trimmed);
        
        // Check for IPv6 literal like [::1]:443
        if host_part.starts_with('[') {
            if let Some(end_bracket) = host_part.find(']') {
                let ip_str = &host_part[1..end_bracket];
                if let Ok(ip) = ip_str.parse::<IpAddr>() {
                    return Ok(ip.to_string());
                }
            }
            return Err("Invalid IPv6 literal format".to_string());
        }

        // Strip port if user typed example.com:443
        // Note: For IPv4 or domains, port is after the last colon
        let host_without_port = if host_part.contains(':') {
            let parts: Vec<&str> = host_part.split(':').collect();
            if parts.len() == 2 && parts[1].chars().all(|c| c.is_ascii_digit()) {
                parts[0]
            } else {
                // If it might be a raw IPv6 address without brackets
                if let Ok(ip) = host_part.parse::<IpAddr>() {
                    return Ok(ip.to_string());
                }
                parts[0]
            }
        } else {
            host_part
        };

        host_without_port.to_lowercase()
    };

    let cleaned = candidate.trim().trim_end_matches('.').to_string();
    if cleaned.is_empty() {
        return Err("Extracted hostname is empty".to_string());
    }

    // Validate standard IP address
    if let Ok(ip) = cleaned.parse::<IpAddr>() {
        return Ok(ip.to_string());
    }

    // Validate Domain / FQDN (RFC 1123)
    if cleaned.len() > 253 {
        return Err("Hostname exceeds maximum RFC length of 253 characters".to_string());
    }

    let labels: Vec<&str> = cleaned.split('.').collect();
    if labels.is_empty() {
        return Err("Invalid domain structure".to_string());
    }

    for label in &labels {
        if label.is_empty() {
            return Err("Domain labels cannot be empty (e.g. consecutive dots)".to_string());
        }
        if label.len() > 63 {
            return Err(format!("Domain label '{}' exceeds 63 characters", label));
        }
        if label.starts_with('-') || label.ends_with('-') {
            return Err(format!("Domain label '{}' cannot start or end with a hyphen", label));
        }
        if !label.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
            return Err(format!("Domain label '{}' contains invalid characters", label));
        }
    }

    Ok(cleaned)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_domains() {
        assert_eq!(sanitize_and_validate_host("example.com").unwrap(), "example.com");
        assert_eq!(sanitize_and_validate_host("sub.domain.co.uk").unwrap(), "sub.domain.co.uk");
        assert_eq!(sanitize_and_validate_host("EXAMPLE.COM").unwrap(), "example.com");
        assert_eq!(sanitize_and_validate_host("  github.com  ").unwrap(), "github.com");
    }

    #[test]
    fn test_url_stripping() {
        assert_eq!(sanitize_and_validate_host("https://example.com").unwrap(), "example.com");
        assert_eq!(sanitize_and_validate_host("https://example.com/").unwrap(), "example.com");
        assert_eq!(sanitize_and_validate_host("https://example.com/path?arg=1#frag").unwrap(), "example.com");
        assert_eq!(sanitize_and_validate_host("http://sub.domain.com:8080/foo").unwrap(), "sub.domain.com");
        assert_eq!(sanitize_and_validate_host("example.com:443").unwrap(), "example.com");
        assert_eq!(sanitize_and_validate_host("example.com/api/v1").unwrap(), "example.com");
    }

    #[test]
    fn test_ips() {
        assert_eq!(sanitize_and_validate_host("1.1.1.1").unwrap(), "1.1.1.1");
        assert_eq!(sanitize_and_validate_host("1.1.1.1:443").unwrap(), "1.1.1.1");
        assert_eq!(sanitize_and_validate_host("[::1]").unwrap(), "::1");
    }

    #[test]
    fn test_invalid_domains() {
        assert!(sanitize_and_validate_host("").is_err());
        assert!(sanitize_and_validate_host("   ").is_err());
        assert!(sanitize_and_validate_host("example..com").is_err());
        assert!(sanitize_and_validate_host("-example.com").is_err());
        assert!(sanitize_and_validate_host("example-.com").is_err());
        assert!(sanitize_and_validate_host("foo;rm -rf /").is_err());
        assert!(sanitize_and_validate_host("example.com' OR 1=1--").is_err());
    }
}
