import { supabase } from "./client";
import { ContainerFile } from "@/types/container";

const BUCKET_NAME = "container-files";

/**
 * Faz upload de um arquivo para o Supabase Storage.
 * @param file O objeto File a ser enviado.
 * @param containerId O ID do container ao qual o arquivo pertence.
 * @returns O caminho completo do arquivo no storage.
 */
export async function uploadContainerFile(file: File, containerId: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error("Usuário não autenticado para upload.");
  }

  // Cria um nome de arquivo único e seguro
  const fileExtension = file.name.split('.').pop();
  const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
  
  // Caminho: user_id/container_id/safe_filename
  const storagePath = `${userId}/${containerId}/${safeFileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error("Erro no upload do Supabase Storage:", error);
    throw new Error(`Falha ao fazer upload do arquivo: ${error.message}`);
  }

  return storagePath;
}

/**
 * Exclui um arquivo do Supabase Storage.
 * @param storagePath O caminho completo do arquivo no storage.
 */
export async function deleteContainerFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error("Erro ao deletar do Supabase Storage:", error);
    // Não lançamos erro se o arquivo não for encontrado, apenas se houver falha de permissão/servidor
    if (error.message.includes("The resource was not found")) {
        return; 
    }
    throw new Error(`Falha ao excluir o arquivo: ${error.message}`);
  }
}

/**
 * Obtém a URL pública/assinada para visualização de um arquivo.
 * Usamos getPublicUrl se o bucket for público, mas como estamos usando RLS, usamos createSignedUrl.
 * @param storagePath O caminho completo do arquivo no storage.
 * @returns A URL assinada para acesso.
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  // O token expira em 60 segundos (tempo suficiente para visualização)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 60); 

  if (error) {
    console.error("Erro ao gerar URL assinada:", error);
    throw new Error(`Falha ao gerar URL para visualização: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Faz o download de um arquivo do Supabase Storage.
 * @param storagePath O caminho completo do arquivo no storage.
 * @param fileName O nome do arquivo para o download.
 */
export async function downloadContainerFile(storagePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error) {
    console.error("Erro ao baixar arquivo:", error);
    throw new Error(`Falha ao baixar o arquivo: ${error.message}`);
  }

  if (data) {
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}