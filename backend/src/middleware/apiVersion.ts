import { errorResponse, ErrorCodes } from '../utils/apiResponse';

export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

export const LATEST_VERSION: ApiVersion = 'v1';

export function apiVersionMiddleware(versions: readonly ApiVersion[] = SUPPORTED_VERSIONS) {
  return (req: any, res: any, next: any) => {
    const versionHeader = req.headers['x-api-version'] as string;
    const urlVersion = req.params.version as ApiVersion;
    
    let version: ApiVersion = LATEST_VERSION;
    
    if (urlVersion && (versions as readonly ApiVersion[]).includes(urlVersion)) {
      version = urlVersion;
    } else if (versionHeader && (versions as readonly ApiVersion[]).includes(versionHeader as ApiVersion)) {
      version = versionHeader as ApiVersion;
    }
    
    res.locals.apiVersion = version;
    res.setHeader('X-API-Version', version);
    
    if (!(versions as readonly ApiVersion[]).includes(version)) {
      return res.status(400).json(
        errorResponse(
          ErrorCodes.SYS_CONFIG_ERROR,
          `不支持的 API 版本: ${version}。当前支持的版本: ${versions.join(', ')}`
        )
      );
    }
    
    next();
  };
}

export function requireVersion(minVersion: ApiVersion) {
  return (req: any, res: any, next: any) => {
    const currentVersion = res.locals.apiVersion as ApiVersion;
    const versionOrder: ApiVersion[] = [...SUPPORTED_VERSIONS].sort();
    
    const currentIndex = versionOrder.indexOf(currentVersion);
    const minIndex = versionOrder.indexOf(minVersion);
    
    if (currentIndex < minIndex) {
      return res.status(400).json(
        errorResponse(
          ErrorCodes.SYS_CONFIG_ERROR,
          `此功能需要 API 版本 ${minVersion} 或更高版本`
        )
      );
    }
    
    next();
  };
}
