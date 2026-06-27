import { getAvailableModels } from '@/actions/gemini'

export default async function ModelsPage() {
  const models = await getAvailableModels()

  return (
    <div className="p-10 flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Modelos Disponibles de Gemini</h1>
      {models.length === 0 ? (
        <p className="text-red-500">No se encontraron modelos. Verifica que GEMINI_API_KEY esté configurada correctamente.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map(model => (
            <div key={model.id} className="p-4 border rounded-lg bg-surface-card flex flex-col gap-1">
              <span className="font-semibold">{model.name}</span>
              <span className="text-xs text-muted font-mono">{model.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
