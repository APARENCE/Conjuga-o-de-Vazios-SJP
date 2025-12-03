import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContainerFile } from "@/types/container";
import { Upload, Eye, Trash2, FileText, Image as ImageIcon, Paperclip, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadContainerFile, deleteContainerFile, getSignedUrl } from "@/integrations/supabase/storage";

interface FileUploadDialogProps {
  containerId: string;
  files: ContainerFile[];
  onFilesChange: (files: ContainerFile[]) => void;
  children: React.ReactNode; // Adicionando children como trigger
}

export function FileUploadDialog({ containerId, files, onFilesChange, children }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ContainerFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteFile, setDeleteFile] = useState<ContainerFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const localToast = useToast(); // Usando o hook para acessar métodos de gerenciamento

  // Função para iniciar a visualização (obtém URL assinada)
  const handlePreview = async (file: ContainerFile) => {
    setPreviewFile(file);
    setPreviewUrl(null);
    
    try {
      const url = await getSignedUrl(file.storagePath);
      setPreviewUrl(url);
    } catch (error) {
      localToast.toast({
        title: "Erro de Visualização",
        description: "Não foi possível carregar o arquivo. Verifique as permissões.",
        variant: "destructive",
      });
      setPreviewFile(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    const newFiles: ContainerFile[] = [];
    const uploadToastId = localToast.toast({
        title: "Iniciando Upload...",
        description: `0 de ${uploadedFiles.length} arquivos enviados.`,
        variant: "default",
        duration: 999999,
    }).id; // Capturando o ID do toast

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // 1. Validação
        if (!file.type.includes("pdf") && !file.type.includes("png") && !file.type.includes("jpeg") && !file.type.includes("jpg")) {
          localToast.toast({
            title: "Tipo de arquivo inválido",
            description: `${file.name} não é um arquivo PDF ou imagem válido.`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          localToast.toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o tamanho máximo de 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        // 2. Upload para o Storage
        const storagePath = await uploadContainerFile(file, containerId);

        newFiles.push({
          id: `${Date.now()}-${i}`,
          name: file.name,
          type: file.type,
          size: file.size,
          storagePath: storagePath, // Salvamos o caminho do storage
          uploadedAt: new Date().toISOString(),
        });
        
        localToast.update(uploadToastId, {
            description: `${i + 1} de ${uploadedFiles.length} arquivos enviados.`,
        });
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
        localToast.update(uploadToastId, {
            title: "Upload Concluído",
            description: `${newFiles.length} arquivo(s) adicionado(s) com sucesso.`,
            variant: "success",
            duration: 3000,
        });
      } else {
        localToast.dismiss(uploadToastId);
      }

    } catch (error) {
      console.error("Erro no upload:", error);
      localToast.update(uploadToastId, {
        title: "Erro Crítico no Upload",
        description: (error as Error).message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (file: ContainerFile) => {
    try {
        // 1. Deleta do Storage
        await deleteContainerFile(file.storagePath);
        
        // 2. Deleta do estado local/DB
        onFilesChange(files.filter((f) => f.id !== file.id));
        setDeleteFile(null);
        
        localToast.toast({
          title: "Arquivo excluído",
          description: "O arquivo foi removido do storage e do registro.",
          variant: "success",
        });
    } catch (error) {
        localToast.toast({
            title: "Erro ao excluir arquivo",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };

  // A função de edição (substituição) é complexa e pode ser simplificada para exclusão + novo upload,
  // mas para manter a funcionalidade de substituição, vamos refatorá-la para usar o Storage.
  const handleEdit = async (file: ContainerFile) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const newFile = target.files?.[0];
      if (!newFile) return;

      // 1. Validação (simplificada)
      if (!newFile.type.includes("pdf") && !newFile.type.includes("png") && !newFile.type.includes("jpeg") && !newFile.type.includes("jpg")) {
        localToast.toast({ title: "Tipo de arquivo inválido", description: "Apenas PDF e imagens são permitidos.", variant: "destructive" });
        return;
      }
      if (newFile.size > 10 * 1024 * 1024) {
        localToast.toast({ title: "Arquivo muito grande", description: "O arquivo excede 10MB.", variant: "destructive" });
        return;
      }
      
      setIsUploading(true);
      const updateToastId = localToast.loading("Substituindo arquivo...");

      try {
        // 2. Deleta o arquivo antigo do Storage
        await deleteContainerFile(file.storagePath);
        
        // 3. Faz upload do novo arquivo
        const newStoragePath = await uploadContainerFile(newFile, containerId);

        // 4. Atualiza o registro no DB
        const updatedFiles = files.map((f) =>
          f.id === file.id
            ? {
                ...f,
                name: newFile.name,
                type: newFile.type,
                size: newFile.size,
                storagePath: newStoragePath,
                uploadedAt: new Date().toISOString(),
              }
            : f
        );
        onFilesChange(updatedFiles);
        
        localToast.update(updateToastId, {
            title: "Arquivo atualizado",
            description: "O arquivo foi substituído com sucesso.",
            variant: "success",
            duration: 3000,
        });
      } catch (error) {
        localToast.update(updateToastId, {
            title: "Erro ao substituir",
            description: (error as Error).message,
            variant: "destructive",
            duration: 5000,
        });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-danger" />;
    if (type.includes("png") || type.includes("jpeg") || type.includes("jpg")) return <ImageIcon className="h-4 w-4 text-success" />;
    return <Paperclip className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Arquivos</DialogTitle>
            <DialogDescription>
              Adicione arquivos PDF ou PNG/JPG. Tamanho máximo: 10MB por arquivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileUpload}
                className="flex-1"
                disabled={isUploading}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="secondary" 
                onClick={() => {
                  const input = document.getElementById('file-upload') as HTMLInputElement;
                  input?.click();
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum arquivo enviado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(file)}
                        title="Visualizar"
                        disabled={isUploading}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(file)}
                        title="Editar (Substituir)"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteFile(file)}
                        title="Excluir"
                        disabled={isUploading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
            {!previewUrl ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    Gerando link seguro...
                </div>
            ) : previewFile?.type.includes("pdf") ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh]"
                title={previewFile.name}
              />
            ) : (
              <img
                src={previewUrl}
                alt={previewFile?.name}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteFile?.name}"? Esta ação removerá o arquivo permanentemente do armazenamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => deleteFile && handleDelete(deleteFile)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}