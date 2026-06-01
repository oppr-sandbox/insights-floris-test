export class ValidationError extends Error {
  public code: number;
  public errorCode: string;
  public errors: Record<string, string[]>;

  constructor(
    code: number,
    message: string,
    errorCode: string,
    errors: Record<string, string[]>
  ) {
    super(message);
    this.code = code;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class SubscriptionRequiredError extends Error {
  constructor(message: string = "An active subscription is required to perform this action.") {
    super(message);
  }
}

export class InternalServerError extends Error {
  public description: string;
  public traceId?: string;

  constructor(message: string, description: string, traceId?: string) {
    super(message);
    this.description = description;
    this.traceId = traceId;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getTenantFromUrl() {
  if (typeof window === "undefined") return null;
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[0] ?? null;
}

export const createHttpClient = (defaultHeaders?: Record<string, string>) => {
  const produceResponse = async (response: Response) => {
    if (!response.ok) {
      const problemDetails = await response.json();
      if (response.status === 400) {
        throw new ValidationError(
          problemDetails.code,
          problemDetails.message,
          problemDetails.errorCode,
          problemDetails.errors
        );
      }
      if (response.status === 401) {
        throw new Error("Not Authorized");
      }
      if (response.status === 403) {
        if (problemDetails.errorCode === "subscription_required") {
          throw new SubscriptionRequiredError(problemDetails.message);
        }
      }
      if (response.status === 404) {
        throw new NotFoundError(
          typeof problemDetails === "string"
            ? problemDetails
            : "The requested resource was not found."
        );
      }
      if (response.status >= 500) {
        throw new InternalServerError(
          "Internal Server Error",
          problemDetails.detail,
          problemDetails.traceId
        );
      }
    }

    const text = await response.clone().text();
    if (!text) return null;
    return await response.json();
  };

  const getHeaders = () => {
    const tenant = getTenantFromUrl();
    const headers: Record<string, string> = {
      ...(defaultHeaders ?? {}),
    };

    if (tenant) {
      headers["X-Tenant"] = tenant;
    }

    return headers;
  };

  const isFormData = (data: any): boolean => data instanceof FormData;
  const redirectToLogin = () => {
    const tenant = getTenantFromUrl();

    // prevent infinite redirect loops
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = `/${tenant}/login`;
    }
  }

  const call = async (url: string, options: RequestInit) => {
    const res = await fetch(API_URL + url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers ?? {}),
        ...getHeaders(),
      },
    });

    if (res.status === 401) {
      const refresh = await fetch(API_URL + "/api/authentication/refresh", {
        method: "POST",
        credentials: "include",
        headers: getHeaders(),
      });

      if (refresh.status === 401 || refresh.status === 403) {
        redirectToLogin();
        throw new Error("Unauthorized");
      }

      return fetch(API_URL + url, {
        ...options,
        credentials: "include",
        headers: {
          ...(options.headers ?? {}),
          ...getHeaders(),
        },
      });
    }

    return res;
  };

  return {
    get: async <T>(url: string) =>
      produceResponse(await call(url, { method: "GET" })),
    post: async <T>(url: string, data: any) =>
      produceResponse(
        await call(url, {
          method: "POST",
          headers: isFormData(data) ? {} : { "Content-Type": "application/json" },
          body: isFormData(data) ? data : JSON.stringify(data),
        })
      ),
    put: async <T>(url: string, data: any) =>
      produceResponse(
        await call(url, {
          method: "PUT",
          headers: isFormData(data) ? {} : { "Content-Type": "application/json" },
          body: isFormData(data) ? data : JSON.stringify(data),
        })
      ),
    patch: async <T>(url: string, data?: any) =>
      produceResponse(
        await call(url, {
          method: "PATCH",
          headers: data && isFormData(data) ? {} : { "Content-Type": "application/json" },
          body: data ? (isFormData(data) ? data : JSON.stringify(data)) : undefined,
        })
      ),
    delete: async <T>(url: string, data?: any) =>
      produceResponse(
        await call(url, {
          method: "DELETE",
          headers: data ? (isFormData(data) ? {} : { "Content-Type": "application/json" }) : undefined,
          body: data ? (isFormData(data) ? data : JSON.stringify(data)) : undefined,
        })
      ),
  };
};
