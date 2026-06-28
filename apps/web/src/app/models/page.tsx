export default async function ModelsPage() {
  return (
    <div className="p-10 flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Modelos Disponibles de Gemini</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-surface-card flex flex-col gap-1">
          <span className="font-semibold">Gemini 3 Pro Image</span>
          <span className="text-xs text-muted font-mono">gemini-3-pro-image</span>
        </div>
      </div>
    </div>
  )
}
