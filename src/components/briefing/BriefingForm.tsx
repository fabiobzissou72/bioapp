"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";
import { compressImage, assertVideoSizeOk } from "@/lib/mediaCompression";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type ServiceRow = { name: string; duration: string; price: string };
type HoursRow = { weekday: number; start: string; end: string };
type CatalogRow = { file: File; itemType: "product" | "service"; previewUrl: string };

const inputClass =
  "rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none focus:border-pink-400";

async function uploadPublic(file: File): Promise<string> {
  assertVideoSizeOk(file);
  const uploadFile = await compressImage(file);
  const formData = new FormData();
  formData.append("file", uploadFile);
  const res = await fetch("/api/briefing/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao enviar arquivo.");
  return data.url;
}

export function BriefingForm() {
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ec4899");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [googleReview, setGoogleReview] = useState("");

  const [hasPix, setHasPix] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [pixCity, setPixCity] = useState("");

  const [hasAddress, setHasAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState("");

  const [services, setServices] = useState<ServiceRow[]>([{ name: "", duration: "60", price: "" }]);
  const [staffNames, setStaffNames] = useState<string[]>([""]);
  const [hours, setHours] = useState<HoursRow[]>([{ weekday: 1, start: "09:00", end: "18:00" }]);

  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);

  const [hasWifi, setHasWifi] = useState(false);
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleNameChange(value: string) {
    setBusinessName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function addCatalogFiles(files: FileList | null) {
    if (!files) return;
    const rows: CatalogRow[] = Array.from(files)
      .slice(0, 20 - catalogRows.length)
      .map((file) => ({ file, itemType: "product", previewUrl: URL.createObjectURL(file) }));
    setCatalogRows((prev) => [...prev, ...rows]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!businessName || !slug || !whatsapp) {
      setError("Preencha pelo menos nome do negócio, link e WhatsApp.");
      return;
    }

    setSubmitting(true);
    try {
      const logoUrl = logoFile ? await uploadPublic(logoFile) : null;
      const coverUrl = coverFile ? await uploadPublic(coverFile) : null;
      const coverType = coverFile?.type.startsWith("video") ? "video" : "image";

      const catalogItems = [];
      for (const row of catalogRows) {
        const url = await uploadPublic(row.file);
        catalogItems.push({
          url,
          mediaType: row.file.type.startsWith("video") ? "video" : "image",
          itemType: row.itemType,
        });
      }

      const res = await fetch("/api/briefing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          slug,
          description,
          primaryColor,
          logoUrl,
          coverUrl,
          coverType,
          whatsapp,
          instagram,
          facebook,
          googleReview,
          hasPix,
          pixKey,
          pixKeyType,
          pixCity,
          hasAddress,
          fullAddress,
          services: services
            .filter((s) => s.name.trim())
            .map((s) => ({
              name: s.name,
              duration: parseInt(s.duration) || 60,
              price: s.price ? parseFloat(s.price.replace(",", ".")) : null,
            })),
          staffNames,
          hours,
          catalogItems,
          hasWifi,
          wifiSsid,
          wifiPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <div className="text-3xl">✅</div>
        <h2 className="text-lg font-semibold text-neutral-900">Recebido!</h2>
        <p className="text-sm text-neutral-500">
          Já criamos um rascunho do seu biosite com essas informações. Vamos revisar e ativar em breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-6 pb-16">
      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">1. Identidade</h2>
        <input
          required
          value={businessName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Nome do negócio"
          className={inputClass}
        />
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <span>abio.app.br/</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={`flex-1 ${inputClass}`}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-neutral-500">
            Uma frase curta que descreve o negócio e o que ele faz. Exemplos: &quot;Especialista em unhas
            naturais&quot;, &quot;Cortes e barba em Pinheiros&quot;, &quot;Bolos e doces sob encomenda&quot;.
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Escreva a descrição do seu negócio aqui"
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-neutral-600">
          Cor principal da marca
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-8 w-12 rounded border border-neutral-200"
          />
        </label>
        <label className="text-sm text-neutral-600">
          Logo (opcional) — clique no botão abaixo e escolha a imagem da sua logo no celular ou computador
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="mt-1 block text-sm"
          />
        </label>
        <label className="text-sm text-neutral-600">
          Foto ou vídeo de capa (opcional) — clique no botão abaixo e escolha o arquivo pra fazer o upload
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="mt-1 block text-sm"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">2. Contato e redes</h2>
        <input
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp com DDD e país (ex: 5511999999999)"
          className={inputClass}
        />
        <input
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="Instagram (@usuario ou link)"
          className={inputClass}
        />
        <input
          value={facebook}
          onChange={(e) => setFacebook(e.target.value)}
          placeholder="Facebook (link, opcional)"
          className={inputClass}
        />
        <div>
          <p className="mb-1 text-xs text-neutral-500">
            Link da sua página de avaliações do Google (se tiver). Ajuda a passar confiança pra quem visita a
            página.
          </p>
          <input
            value={googleReview}
            onChange={(e) => setGoogleReview(e.target.value)}
            placeholder="Link de avaliação no Google (opcional)"
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input type="checkbox" checked={hasPix} onChange={(e) => setHasPix(e.target.checked)} />
          Aceita Pix
        </label>
        {hasPix && (
          <div className="flex flex-col gap-2 pl-1">
            <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)} className={inputClass}>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave aleatória</option>
            </select>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Chave Pix"
              className={inputClass}
            />
            <input
              value={pixCity}
              onChange={(e) => setPixCity(e.target.value)}
              placeholder="Cidade do recebedor"
              className={inputClass}
            />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">3. Endereço</h2>
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input type="checkbox" checked={hasAddress} onChange={(e) => setHasAddress(e.target.checked)} />
          Atende em endereço fixo
        </label>
        {hasAddress && (
          <textarea
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            placeholder="Endereço completo (rua, número, bairro, cidade, estado)"
            className={inputClass}
          />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">4. Serviços</h2>
        <p className="text-xs text-neutral-500">
          Pra cada serviço, informe quanto tempo ele demora (em minutos — ex: 30, 45, 60) e o preço. Isso é
          usado pra montar os horários de agendamento automaticamente.
        </p>
        {services.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={s.name}
              onChange={(e) =>
                setServices((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))
              }
              placeholder="Nome do serviço"
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="number"
              value={s.duration}
              onChange={(e) =>
                setServices((prev) =>
                  prev.map((row, idx) => (idx === i ? { ...row, duration: e.target.value } : row))
                )
              }
              placeholder="Ex: 45"
              className={`w-16 ${inputClass}`}
            />
            <span className="text-xs text-neutral-400">min</span>
            <input
              value={s.price}
              onChange={(e) =>
                setServices((prev) => prev.map((row, idx) => (idx === i ? { ...row, price: e.target.value } : row)))
              }
              placeholder="R$"
              className={`w-20 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => setServices((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-sm text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setServices((prev) => [...prev, { name: "", duration: "60", price: "" }])}
          className="self-start text-sm font-medium text-pink-600"
        >
          + serviço
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">5. Profissionais e horários</h2>
        {staffNames.map((name, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={name}
              onChange={(e) =>
                setStaffNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
              }
              placeholder="Nome do profissional"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => setStaffNames((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-sm text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setStaffNames((prev) => [...prev, ""])}
          className="self-start text-sm font-medium text-pink-600"
        >
          + profissional
        </button>

        <p className="mt-2 text-xs text-neutral-400">Horários (aplicados a todos os profissionais):</p>
        {hours.map((h, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              value={h.weekday}
              onChange={(e) =>
                setHours((prev) =>
                  prev.map((row, idx) => (idx === i ? { ...row, weekday: parseInt(e.target.value) } : row))
                )
              }
              className={inputClass}
            >
              {WEEKDAYS.map((d, wi) => (
                <option key={wi} value={wi}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={h.start}
              onChange={(e) =>
                setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, start: e.target.value } : row)))
              }
              className={inputClass}
            />
            <span className="text-sm text-neutral-400">até</span>
            <input
              type="time"
              value={h.end}
              onChange={(e) =>
                setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, end: e.target.value } : row)))
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setHours((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-sm text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setHours((prev) => [...prev, { weekday: 1, start: "09:00", end: "18:00" }])}
          className="self-start text-sm font-medium text-pink-600"
        >
          + horário
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">6. Catálogo (fotos/vídeos dos trabalhos)</h2>
        <p className="text-xs text-neutral-500">
          Clique no botão abaixo pra fazer upload das fotos ou vídeos direto do seu celular ou computador — pode
          escolher vários de uma vez.
        </p>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => addCatalogFiles(e.target.files)}
          className="text-sm"
        />
        {catalogRows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {catalogRows.map((row, i) => (
              <div key={i} className="flex w-[31%] flex-col gap-1">
                {row.file.type.startsWith("video") ? (
                  <video src={row.previewUrl} className="aspect-square w-full rounded-lg object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.previewUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
                )}
                <select
                  value={row.itemType}
                  onChange={(e) =>
                    setCatalogRows((prev) =>
                      prev.map((r, idx) =>
                        idx === i ? { ...r, itemType: e.target.value as "product" | "service" } : r
                      )
                    )
                  }
                  className="rounded border border-neutral-200 bg-white text-xs"
                >
                  <option value="product">Produto</option>
                  <option value="service">Serviço</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCatalogRows((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500"
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-neutral-900">7. Wi-Fi (opcional)</h2>
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input type="checkbox" checked={hasWifi} onChange={(e) => setHasWifi(e.target.checked)} />
          Tem Wi-Fi pra cliente
        </label>
        {hasWifi && (
          <div className="flex flex-col gap-2 pl-1">
            <input
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              placeholder="Nome da rede"
              className={inputClass}
            />
            <input
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder="Senha"
              className={inputClass}
            />
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-pink-600 px-5 py-3 font-medium text-white shadow disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
