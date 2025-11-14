import { useState } from "react";
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
import { Upload, Eye, Trash2, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
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

interface FileUploadDialogProps {
  containerId: string;
  files: ContainerFile[];
  onFilesChange: (files: ContainerFile[]) => void;
}

export function FileUploadDialog({ containerId, files, onFilesChange }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ContainerFile | null>(null);
  const [deleteFile, setDeleteFile] = useState<ContainerFile | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: ContainerFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      // Validar tipo de arquivo
      if (!file.type.includes("pdf") && !file.type.includes("png") && !file.type.includes("jpeg") && !file.type.includes("jpg")) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um arquivo PDF ou PNG válido.`,
          variant: "destructive",
        });
        continue;
      }

      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o tamanho máximo de 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          newFiles.push({
            id: `${Date.now()}-${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            uploadedAt: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
      toast({
        title: "Arquivos enviados",
        description: `${newFiles.length} arquivo(s) adicionado(s) com sucesso.`,
      });
    }

    // Reset input
    e.target.value = "";
  };

  const handleDelete = (file: ContainerFile) => {
    onFilesChange(files.filter((f) => f.id !== file.id));
    setDeleteFile(null);
    toast({
      title: "Arquivo excluído",
      description: "O arquivo foi removido com sucesso.",
    });
  };

  const handleEdit = async (file: ContainerFile) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const newFile = target.files?.[0];
      if (!newFile) return;

      // Validar tipo
      if (!newFile.type.includes("pdf") && !newFile.type.includes("png") && !newFile.type.includes("jpeg") && !newFile.type.includes("jpg")) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas arquivos PDF e PNG são permitidos.",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho
      if (newFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo excede o tamanho máximo de 10MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const updatedFiles = files.map((f) =>
          f.id === file.id
            ? {
                ...f,
                name: newFile.name,
                type: newFile.type,
                size: newFile.size,
                dataUrl,
                uploadedAt: new Date().toISOString(),
              }
            : f
        );
        onFilesChange(updatedFiles);
        toast({
          title: "Arquivo atualizado",
          description: "O arquivo foi substituído com sucesso.",
        });
      };
      reader.readAsDataURL(newFile);
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
          <Button variant="outline" size="sm" className="gap-2">
            <Paperclip className="h-4 w-4" />
            {files.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {files.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Arquivos</DialogTitle>
            <DialogDescription>
              Adicione arquivos PDF ou PNG. Tamanho máximo: 10MB por arquivo.
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
              />
              <Button type="button" size="icon" variant="secondary" onClick={() => {
                const input = document.getElementById('file-upload') as HTMLInputElement;
                input?.click();
              }}>
                <Upload className="h-4 w-4" />
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
                        onClick={() => setPreviewFile(file)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(file)}
                        title="Editar (Substituir)"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteFile(file)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
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
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewFile?.type.includes("pdf") ? (
              <iframe
                src={previewFile.dataUrl}
                className="w-full h-[70vh]"
                title={previewFile.name}
              />
            ) : (
              <img
                src={previewFile?.dataUrl}
                alt={previewFile?.name}
                className="w-full h-auto"
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
              Tem certeza que deseja excluir "{deleteFile?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteFile && handleDelete(deleteFile)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
