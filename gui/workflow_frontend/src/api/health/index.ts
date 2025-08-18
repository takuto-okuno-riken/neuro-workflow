export type Methods = {
  get: {
    resBody: {
      status: "ok" | "error";
      timestamp: string;
      version?: string;
      database?: "connected" | "disconnected";
    };
  };
};
