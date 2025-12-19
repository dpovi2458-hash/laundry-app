import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  };

  return NextResponse.json({
    message: 'Configuración de Appwrite',
    config,
    hasEndpoint: !!config.endpoint,
    hasProjectId: !!config.projectId,
    hasDatabaseId: !!config.databaseId,
  });
}
