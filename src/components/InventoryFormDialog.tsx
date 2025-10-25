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

const InventorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().min(1, "SKU é obrigatório"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  location: z.string().min(1, "Localização é obrigatória"),
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
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        quantity: 0,
        location: "",
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}