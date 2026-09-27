export interface HttpMetadata {
  x_cache: string | null;
  cf_cache_status: string | null;
  server: string | null;
  date: string | null;
  x_powered_by: string | null;
  status_code: number;
  roundtrip_ms: number;
}

export interface VerificationIssue {
  code?: string;
  severity?: string;
  message?: string;
  certificate?: number;
}

export interface CertificateItem {
  position: number;
  role: string;
  version?: number;
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  serial_number?: string;
  serial_number_hex?: string;
  signature?: {
    short_name?: string;
    long_name?: string;
    nid?: number;
  };
  validity?: {
    from?: string;
    to?: string;
    currently_valid?: boolean;
    expired?: boolean;
    not_yet_valid?: boolean;
    days_remaining?: number;
    lifetime_days?: number;
  };
  subject_alt_names?: Array<{
    type?: string;
    value?: string;
  }>;
  fingerprints?: {
    sha256?: string;
    sha1?: string;
  };
  public_key?: {
    type?: string;
    bits?: number;
    pem?: string;
    ec?: {
      curve_name?: string;
      curve_oid?: string;
      x_hex?: string;
      y_hex?: string;
    };
    rsa?: {
      modulus_hex?: string;
      exponent?: number;
    };
  };
  is_ca?: boolean;
  self_signed?: boolean;
  pem?: string;
  extensions?: Record<string, string>;
}

export interface InspectionData {
  target?: {
    host: string;
    port: number;
    endpoint: string;
  };
  connection?: {
    successful: boolean;
    connect_time_ms?: number;
    remote_address?: string;
    timed_out?: boolean;
    blocked?: boolean;
    eof?: boolean;
    stream_type?: string;
    mode?: string;
  };
  tls?: {
    negotiated?: {
      protocol?: string;
      cipher_name?: string;
      cipher_bits?: number;
      cipher_version?: string;
    };
    protocols?: {
      supported?: string[];
      minimum?: string;
      maximum?: string;
      probes?: Record<
        string,
        {
          available_in_runtime?: boolean;
          supported?: boolean;
          duration_ms?: number;
          negotiated?: {
            protocol?: string;
            cipher_name?: string;
            cipher_bits?: number;
            cipher_version?: string;
          };
        }
      >;
    };
  };
  verification?: {
    trusted: boolean;
    status: string;
    issues?: VerificationIssue[];
  };
  certificates?: {
    count: number;
    server_sent_root?: boolean;
    relationships?: Array<{
      certificate: number;
      issuer_certificate: number;
      signature_valid: boolean;
    }>;
    chain?: CertificateItem[];
    complete_pem?: string;
  };
  inspection?: {
    timestamp: string;
    duration_ms?: number;
  };
  [key: string]: any;
}

export interface InspectionEnvelope {
  id: number | null;
  host: string;
  metadata: HttpMetadata;
  data: InspectionData;
  raw_json: string;
  from_cache: boolean;
}

export interface HistoryItemSummary {
  id: number;
  host: string;
  inspected_at: string;
  is_trusted: boolean;
  tls_version: string | null;
  cipher_name: string | null;
  x_cache: string | null;
  duration_ms: number | null;
}

export interface HealthStatus {
  healthy: boolean;
  status_code: number;
  message: string;
  checked_at: string;
  x_powered_by: string | null;
}
