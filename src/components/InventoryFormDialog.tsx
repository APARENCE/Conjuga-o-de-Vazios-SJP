import { useState, useEffect } from "react";
import { InventoryItem } from "@/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const InventorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().min(1, "SKU é obrigatório"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  location: z.string().min(1, "Localização é obrigatória"),
  status: z.enum(['Em Estoque', 'Aguardando Devolução', 'RIC OK', 'Outro']),
  associatedContainer: z.string().optional(), // Novo campo
});

type InventoryFormData = z.infer<typeof InventorySchema>;

interface InventoryFormDialogProps {
  item?: InventoryItem;
  onSave: (data: InventoryFormData) => void;
  trigger?: React.ReactNode;
}

export function InventoryFormDialog({ item, onSave, trigger }: InventoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(InventorySchema),
    defaultValues: {
      name: item?.name || "",
      sku: item?.sku || "",
      quantity: item?.quantity || 0,
      location: item?.location || "",
      status: (item?.status as InventoryFormData['status']) || "Em Estoque",
      associatedContainer: item?.associatedContainer || "", // Novo default
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        status: (item.status as InventoryFormData['status']) || "Em Estoque",
        associatedContainer: item.associatedContainer || "", // Novo reset
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        quantity: 0,
        location: "",
        status: "Em Estoque",
        associatedContainer: "",
      });
    }
  }, [item, form, open]);

  const onSubmit = (data: InventoryFormData) => {
    onSave(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Item" : "Novo Item de Inventário"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ex: Pneu 205/55 R16"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...form.register("sku")}
                placeholder="Ex: PN-20555R16"
              />
              {form.formState.errors.sku && (
                <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                {...form.register("quantity", { valueAsNumber: true })}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização *</Label>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Ex: Armazém A, Prateleira 3"
              />
              {form.formState.errors.location && (
                <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>
            
            {/* Novo Campo: Container Associado */}
            <div className="space-y-2">
              <Label htmlFor="associatedContainer">Container Associado (Opcional)</Label>
              <Input
                id="associatedContainer"
                {...form.register("associatedContainer")}
                placeholder="Ex: ABCU1234567"
              />
              {form.formState.errors.associatedContainer && (
                <p className="text-xs text-destructive">{form.formState.errors.associatedContainer.message}</p>
              )}
            </div>

            {/* Campo de Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status do item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Em Estoque">Em Estoque</SelectItem>
                      <SelectItem value="Aguardando Devolução">Aguardando Devolução</SelectItem>
                      <SelectItem value="RIC OK">RIC OK (Devolvido)</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}