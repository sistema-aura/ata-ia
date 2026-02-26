import { AtaFormData } from "@/types/ata";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Calendar, Users } from "lucide-react";

interface Props {
  formData: AtaFormData;
  updateField: (field: keyof AtaFormData, value: any) => void;
}

export const AssemblyInfoForm = ({ formData, updateField }: Props) => {
  return (
    <div className="space-y-6">
      {/* Identificação do Condomínio */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-document">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Identificação do Condomínio
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nomeCondominio">Nome / Morada do Condomínio</Label>
            <Input
              id="nomeCondominio"
              placeholder="Ex: Edifício Sol Nascente"
              value={formData.nomeCondominio}
              onChange={(e) => updateField("nomeCondominio", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nifCondominio">NIF do Condomínio</Label>
            <Input
              id="nifCondominio"
              placeholder="Ex: 123456789"
              value={formData.nifCondominio}
              onChange={(e) => updateField("nifCondominio", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="morada">Morada Completa</Label>
            <Input
              id="morada"
              placeholder="Rua, número, código postal"
              value={formData.morada}
              onChange={(e) => updateField("morada", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freguesia">Freguesia</Label>
            <Input
              id="freguesia"
              placeholder="Ex: São Domingos de Benfica"
              value={formData.freguesia}
              onChange={(e) => updateField("freguesia", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="concelho">Concelho</Label>
            <Input
              id="concelho"
              placeholder="Ex: Lisboa"
              value={formData.concelho}
              onChange={(e) => updateField("concelho", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="localReuniao">Local da Reunião</Label>
            <Input
              id="localReuniao"
              placeholder="Ex: Hall de entrada"
              value={formData.localReuniao}
              onChange={(e) => updateField("localReuniao", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Dados da Assembleia */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-document">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Dados da Assembleia
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="dataAssembleia">Data</Label>
            <Input
              id="dataAssembleia"
              type="date"
              value={formData.dataAssembleia}
              onChange={(e) => updateField("dataAssembleia", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="horaInicio">Hora de Início</Label>
            <Input
              id="horaInicio"
              type="time"
              value={formData.horaInicio}
              onChange={(e) => updateField("horaInicio", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoAssembleia">Tipo</Label>
            <Select
              value={formData.tipoAssembleia}
              onValueChange={(v) => updateField("tipoAssembleia", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinaria">Ordinária</SelectItem>
                <SelectItem value="extraordinaria">Extraordinária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="convocatoria">Convocatória</Label>
            <Select
              value={formData.convocatoria}
              onValueChange={(v) => updateField("convocatoria", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primeira">1ª Convocatória</SelectItem>
                <SelectItem value="segunda">2ª Convocatória</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="presidenteMesa">Presidente da Mesa</Label>
            <Input
              id="presidenteMesa"
              placeholder="Nome completo"
              value={formData.presidenteMesa}
              onChange={(e) => updateField("presidenteMesa", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretario">Secretário</Label>
            <Input
              id="secretario"
              placeholder="Nome completo"
              value={formData.secretario}
              onChange={(e) => updateField("secretario", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Presenças */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-document">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Presenças
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="totalFracoes">Total de Frações</Label>
            <Input
              id="totalFracoes"
              type="number"
              placeholder="Ex: 20"
              value={formData.totalFracoes}
              onChange={(e) => updateField("totalFracoes", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fracoesPresentes">Frações Presentes</Label>
            <Input
              id="fracoesPresentes"
              type="number"
              placeholder="Ex: 12"
              value={formData.fracoesPresentes}
              onChange={(e) => updateField("fracoesPresentes", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fracoesRepresentadas">Representadas</Label>
            <Input
              id="fracoesRepresentadas"
              type="number"
              placeholder="Ex: 3"
              value={formData.fracoesRepresentadas}
              onChange={(e) =>
                updateField("fracoesRepresentadas", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentagemPresente">% Capital Presente</Label>
            <Input
              id="percentagemPresente"
              type="number"
              placeholder="Ex: 67.5"
              value={formData.percentagemPresente}
              onChange={(e) =>
                updateField("percentagemPresente", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
