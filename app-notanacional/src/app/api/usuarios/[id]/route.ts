import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRobotToken } from "@/lib/notanacional-api";
import { getEnv } from "@/lib/env";
import { canAccessUsuarios, isAdministrador } from "@/lib/permissions";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!canAccessUsuarios(currentUser.role)) {
      return NextResponse.json(
        { message: "Acesso negado. Apenas usuários com perfil Gestão podem acessar." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const token = await getRobotToken();
    const env = getEnv();

    const response = await fetchWithAuth(`${env.API_BASE_URL}/api/Usuarios/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { message: error || "Erro ao buscar usuário" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validar se o usuário pertence ao prestador
    if (data.prestadorId !== currentUser.prestadorId) {
      return NextResponse.json(
        { message: "Acesso negado" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!canAccessUsuarios(currentUser.role)) {
      return NextResponse.json(
        { message: "Acesso negado. Apenas usuários com perfil Gestão podem acessar." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const token = await getRobotToken();
    const env = getEnv();

    // Primeiro buscar o usuário para validar ownership
    const checkResponse = await fetchWithAuth(`${env.API_BASE_URL}/api/Usuarios/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (checkResponse.ok) {
      const userData = await checkResponse.json();
      
      console.log("[Usuarios][PUT] Dados do usuário alvo:", JSON.stringify(userData, null, 2));
      console.log("[Usuarios][PUT] Role do usuário logado:", currentUser.role);
      
      // Validar se pertence ao mesmo prestador
      if (userData.prestadorId !== currentUser.prestadorId) {
        return NextResponse.json(
          { message: "Acesso negado" },
          { status: 403 }
        );
      }

      // Proteger usuários Administrador - só podem ser alterados por outro Administrador
      // Verificar todos os campos possíveis onde a role pode estar
      const targetUserRole = String(userData.role || userData.perfil || userData.Perfil || userData.Role || "");
      const isTargetAdmin = isAdministrador(targetUserRole);
      const isCurrentAdmin = isAdministrador(currentUser.role);

      console.log("[Usuarios][PUT] Target role:", targetUserRole, "| Is admin:", isTargetAdmin);
      console.log("[Usuarios][PUT] Current role:", currentUser.role, "| Is admin:", isCurrentAdmin);

      if (isTargetAdmin && !isCurrentAdmin) {
        console.log("[Usuarios][PUT] BLOQUEADO - Gestão tentando modificar Administrador");
        return NextResponse.json(
          { message: "Apenas usuários com perfil Administrador podem alterar outros Administradores" },
          { status: 403 }
        );
      }
    }

    // Garantir que não mude o prestadorId
    const payload = {
      ...body,
      prestadorId: currentUser.prestadorId,
    };

    const response = await fetchWithAuth(`${env.API_BASE_URL}/api/Usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { message: error || "Erro ao atualizar usuário" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!canAccessUsuarios(currentUser.role)) {
      return NextResponse.json(
        { message: "Acesso negado. Apenas usuários com perfil Gestão podem acessar." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const token = await getRobotToken();
    const env = getEnv();

    // Primeiro buscar o usuário para validar ownership
    const checkResponse = await fetchWithAuth(`${env.API_BASE_URL}/api/Usuarios/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (checkResponse.ok) {
      const userData = await checkResponse.json();
      
      console.log("[Usuarios][DELETE] Dados do usuário alvo:", JSON.stringify(userData, null, 2));
      console.log("[Usuarios][DELETE] Role do usuário logado:", currentUser.role);
      
      // Validar se pertence ao mesmo prestador
      if (userData.prestadorId !== currentUser.prestadorId) {
        return NextResponse.json(
          { message: "Acesso negado" },
          { status: 403 }
        );
      }

      // Proteger usuários Administrador - só podem ser removidos por outro Administrador
      // Verificar todos os campos possíveis onde a role pode estar
      const targetUserRole = String(userData.role || userData.perfil || userData.Perfil || userData.Role || "");
      const isTargetAdmin = isAdministrador(targetUserRole);
      const isCurrentAdmin = isAdministrador(currentUser.role);

      console.log("[Usuarios][DELETE] Target role:", targetUserRole, "| Is admin:", isTargetAdmin);
      console.log("[Usuarios][DELETE] Current role:", currentUser.role, "| Is admin:", isCurrentAdmin);

      if (isTargetAdmin && !isCurrentAdmin) {
        console.log("[Usuarios][DELETE] BLOQUEADO - Gestão tentando remover Administrador");
        return NextResponse.json(
          { message: "Apenas usuários com perfil Administrador podem remover outros Administradores" },
          { status: 403 }
        );
      }
    }

    const response = await fetchWithAuth(`${env.API_BASE_URL}/api/Usuarios/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { message: error || "Erro ao excluir usuário" },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
