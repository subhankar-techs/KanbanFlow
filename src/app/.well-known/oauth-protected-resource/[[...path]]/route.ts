import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from "mcp-handler";

// RFC 9728 metadata telling MCP clients (e.g. claude.ai connectors) to sign in via Supabase Auth.
// Serves both /.well-known/oauth-protected-resource and /.well-known/oauth-protected-resource/api/mcp.
const handler = protectedResourceHandler({
  authServerUrls: [`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`],
});

export { handler as GET };
export const OPTIONS = metadataCorsOptionsRequestHandler();
