'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAvailableModels, processTryOn, analyzeStylePromptFromImage } from '@/services/gemini';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Trash2, UploadCloud, Download, Image as ImageIcon, Sparkles, Info, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, Eye, Coins, Camera, Settings } from 'lucide-react';

interface VtoVariables {
  prenda: string;
  fit: string;
  tela: string;
  pose: string;
  resolution: string;
  keyWords: string;
}

const PRENDA_OPTIONS = ['Pantalon', 'Short', 'Remera', 'Top', 'Vestido', 'Campera', 'Buzo', 'Pollera', 'Camisa', 'Crop Top', 'Blazer', 'Enterito'];
const FIT_OPTIONS = ['Slim', 'Oversize', 'Regular', 'Baggy', 'Loose', 'Skinny', 'Straight', 'Cropped', 'Tailored'];
const TELA_OPTIONS = ['Algodon', 'Denim / Jean', 'Lino', 'Seda', 'Satin', 'Ribo / Morley', 'Lanilla', 'Cuero sintetico', 'Gabardina', 'Lycra', 'Encaje', 'Tul', 'Lurex'];
const POSE_OPTIONS = ['Mirando a camara', 'De perfil', 'Caminando', 'Sentada', 'De espaldas mostrando detalle', 'Manos en los bolsillos', 'Ajustandose la prenda', 'Pose editorial / Alta costura', 'En movimiento / Saltando', 'Relajada / Descontracturada'];
const RESOLUTION_OPTIONS = ['4:5', '1:1', '9:16', '16:9', '2:3'];
const KEY_WORDS_OPTIONS = ['flama', 'canchero', 'fanbuloso', 'hot', 'diosa', 'iconico', 'mood', 'chill', 'total look', 'una bomba', 'clave', 'outfitazo', 'de locos', 'aesthetic'];

const DEFAULT_CLOTHES = [
  '/clothes/pexels-cottonbro-7716960.jpg',
  '/clothes/pexels-enginakyurt-19995460.jpg',
  '/clothes/pexels-enginakyurt-4554337.jpg',
  '/clothes/pexels-marceloverfe-19895977.jpg',
  '/clothes/pexels-mart-production-9558265.jpg',
  '/clothes/pexels-mockupbee-221716013-12039633.jpg'
];

const DEFAULT_MODELS = [
  '/models/mens-fashion-loose-cotton-shirt.jpg',
  '/models/model-laughs-barefoot.jpg',
  '/models/pexels-abaq-studio-1957487599-29119345.jpg',
  '/models/pexels-eduardo-vite-211353151-24286256.jpg',
  '/models/pexels-er17-16962545.jpg',
  '/models/pexels-godisable-jacob-226636-794063.jpg',
  '/models/pexels-gustavo-fring-5622840.jpg',
  '/models/pexels-krivitskiy-6971165.jpg',
  '/models/pexels-manzano-16924901.jpg',
  '/models/pexels-ph-belu-jurado-615194884-17561664.jpg',
  '/models/pexels-rulomx-11722289.jpg',
  '/models/pexels-rulomx-11722296.jpg',
  '/models/pexels-rulomx-11882392.jpg',
  '/models/pexels-sergiolalala-22717318.jpg',
  '/models/pexels-stephanlouis-8414003.jpg',
  '/models/pink-summer-outfit.jpg'
];

interface LocalImage {
  file: File;
  previewUrl: string;
  base64?: string;
  mimeType?: string;
}

interface Instance {
  id: string;
  title: string;
  anchorImages: LocalImage[];
  modelImages: LocalImage[];
  variables?: Partial<VtoVariables>;
}

interface ResultItem {
  filename: string;
  base64: string;
  mimeType: string;
  originalB64: string;
  originalMime: string;
  instanceIndex: number;
}

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface VariableSelectorProps {
  label: string;
  options: string[];
  value: string;
  onChange: (newValue: string) => void;
}

function VariableSelector({ label, options, value, onChange }: VariableSelectorProps) {
  const isCustom = value && !options.includes(value);
  const customValue = isCustom ? value : '';

  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-border last:pb-0 last:border-0 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-xs text-foreground/80">{label}</Label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-destructive hover:text-red-500 flex items-center gap-1 font-medium transition"
            title="Limpiar selección"
          >
            <X size={12} /> Limpiar (X)
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1 mt-0.5">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(isSelected ? '' : opt)}
              className={`text-xs px-2.5 py-1 rounded-md border transition duration-150 font-medium ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/40 border-secondary-foreground/10 text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Otro:</span>
        <Input
          type="text"
          placeholder="Escribe otra opción..."
          value={customValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs px-2.5 py-0.5"
        />
      </div>
    </div>
  );
}

interface InstanceVariableSelectorProps {
  label: string;
  options: string[];
  globalValue: string;
  overrideValue: string | undefined;
  onChange: (newValue: string | undefined) => void;
}

function InstanceVariableSelector({ label, options, globalValue, overrideValue, onChange }: InstanceVariableSelectorProps) {
  const value = overrideValue !== undefined ? overrideValue : '';
  const isOverridden = overrideValue !== undefined;
  const activeValue = isOverridden ? overrideValue : globalValue;
  
  const isCustom = activeValue && !options.includes(activeValue);
  const customValue = isCustom ? activeValue : '';

  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-border/40 last:pb-0 last:border-0 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-semibold text-xs text-foreground/80">{label}</Label>
          {isOverridden ? (
            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded font-bold">
              Personalizado
            </span>
          ) : (
            <span className="text-[9px] bg-muted text-muted-foreground border border-muted-foreground/10 px-1.5 py-0.2 rounded font-medium">
              Heredado: {globalValue || 'Vacío'}
            </span>
          )}
        </div>
        
        {isOverridden && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[11px] text-destructive hover:text-red-500 flex items-center gap-0.5 font-medium transition"
            title="Usar valor global"
          >
            <RefreshCw size={10} /> Restablecer
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1 mt-0.5">
        {options.map((opt) => {
          const isSelected = activeValue === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (isSelected && isOverridden) {
                  onChange(undefined);
                } else {
                  onChange(opt);
                }
              }}
              className={`text-xs px-2 py-0.5 rounded-md border transition duration-150 font-medium ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/40 border-secondary-foreground/10 text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Otro:</span>
        <Input
          type="text"
          placeholder={isOverridden ? "Escribe otra opción..." : `Usar global: ${customValue || 'Ninguno'}`}
          value={isOverridden ? overrideValue : ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-7 text-xs px-2 py-0.5"
        />
      </div>
    </div>
  );
}

function compilePrompt(globalVars: VtoVariables, instanceOverrides?: Partial<VtoVariables>): string {
  const prenda = instanceOverrides?.prenda !== undefined ? instanceOverrides.prenda : globalVars.prenda;
  const fit = instanceOverrides?.fit !== undefined ? instanceOverrides.fit : globalVars.fit;
  const tela = instanceOverrides?.tela !== undefined ? instanceOverrides.tela : globalVars.tela;
  const pose = instanceOverrides?.pose !== undefined ? instanceOverrides.pose : globalVars.pose;
  const resolution = instanceOverrides?.resolution !== undefined ? instanceOverrides.resolution : globalVars.resolution;

  let parts = ["Fotografía editorial de moda profesional de un/una modelo"];
  
  if (prenda) {
    parts.push(`vistiendo ${prenda}`);
  }
  
  parts[parts.length - 1] += ".";
  
  let secondSentence = [];
  if (fit) {
    secondSentence.push(`presenta una silueta ${fit}`);
  }
  if (tela) {
    secondSentence.push(`con textura de ${tela}`);
  }
  
  if (secondSentence.length > 0) {
    parts.push("El conjunto " + secondSentence.join(" ") + ".");
  }
  
  if (pose) {
    parts.push(`El/la modelo está en una postura de ${pose}.`);
  }
  
  parts.push("Manteniendo la iluminación exacta, paleta de colores y atmósfera de la imagen de referencia. Estilo de catálogo de alta gama, enfoque nítido en los detalles de la tela, caída realista de la tela, resolución 8k");
  
  const res = resolution || '4:5';
  
  return parts.join(" ") + ` --ar ${res}`;
}

export default function TryOnStudio() {
  const apiKey = '';
  const selectedModel = 'gemini-1.5-pro';
  const models: {name: string, displayName: string}[] = [];
  const [globalVars, setGlobalVars] = useState<VtoVariables>({
    prenda: '',
    fit: '',
    tela: '',
    pose: '',
    resolution: '4:5',
    keyWords: ''
  });
  const [showGlobalVars, setShowGlobalVars] = useState(true);
  const [openInstances, setOpenInstances] = useState<Record<string, boolean>>({});
  const [isUnlimited, setIsUnlimited] = useState(false);

  const toggleInstanceAccordion = (id: string) => {
    setOpenInstances(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateGlobalVars = (updater: (prev: VtoVariables) => VtoVariables) => {
    setGlobalVars(prev => {
      const next = updater(prev);
      localStorage.setItem('vto_global_variables', JSON.stringify(next));
      return next;
    });
  };
  
  const [showClothesGallery, setShowClothesGallery] = useState(false);
  const [showModelsGallery, setShowModelsGallery] = useState(false);
  
  const [instances, setInstances] = useState<Instance[]>([{ id: `inst-${Date.now()}`, title: 'Instancia 1', anchorImages: [], modelImages: [], variables: {} }]);
  
  const [results, setResults] = useState<ResultItem[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const [processErrors, setProcessErrors] = useState<string[]>([]);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showReprocess, setShowReprocess] = useState(false);
  const [reprocessSource, setReprocessSource] = useState<'generated' | 'original'>('generated');
  
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewInstIdx, setPreviewInstIdx] = useState<number | null>(null);

  const [showApiHelp, setShowApiHelp] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCredits, setShowCredits] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const styleRefInput = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchServerModels = async () => {};

  const handleBuyCredits = async () => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Error al iniciar checkout: " + (data.error || "Intenta nuevamente."));
      }
    } catch (err) {
      console.error("Checkout error", err);
      alert("Error al conectar con Mercado Pago.");
    }
    setIsCheckoutLoading(false);
  };

  // Load saved config and listen for auth state changes
  useEffect(() => {
    // Listen for auth errors in the URL and payment success redirects
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      // 1. Manejo de Errores de Autenticación
      const authErr = params.get('authError');
      if (authErr) {
        setLoginError(authErr);
        setShowAuthModal(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }

      // 2. Sincronización Instantánea de Créditos después de Comprar
      const paymentStatus = params.get('payment') || params.get('status') || params.get('collection_status');
      const paymentId = params.get('payment_id') || params.get('collection_id');

      if ((paymentStatus === 'success' || paymentStatus === 'approved') && paymentId) {
        setStatusText('Sincronizando créditos con Mercado Pago...');
        setIsProcessing(true);
        
        fetch(`/api/sync-credits?payment_id=${paymentId}`)
          .then(async (res) => {
            const data = await res.json();
            if (res.ok && data.success) {
              setCredits(data.credits);
              alert(data.message || '¡Tus créditos se han acreditado con éxito!');
            } else {
              console.error('Error al sincronizar créditos:', data.error);
              alert('Tu pago fue aprobado, pero se acreditará de forma asíncrona mediante el webhook en unos segundos.');
            }
          })
          .catch((err) => {
            console.error('Error en fetch de sincronización:', err);
          })
          .finally(() => {
            setIsProcessing(false);
            setStatusText('');
            // Limpiar los parámetros de la URL de pago para evitar re-ejecución al recargar la página
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          });
      }
    }

    // Función para sincronizar datos de un usuario logueado en tiempo real
    const syncUserSession = async (user: User | null) => {
      if (!user) {
        setUserId(null);
        setIsUnlimited(false);
        setCredits(0);
        return;
      }

      setUserId(user.id);
      setIsUnlimited(user.email === 'zanardi.ag@gmail.com');
      
      // Obtener o crear perfil
      let { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .maybeSingle();
         
      const welcomeCreditsGiven = user.user_metadata?.welcome_credits_given;
      const currentCredits = profile?.credits;

      if (!profile || currentCredits === null || currentCredits === undefined || !welcomeCreditsGiven) {
        const targetCredits = Math.max(5, typeof currentCredits === 'number' ? currentCredits : 0);

        if (!profile) {
          // Crear perfil si no existe
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              credits: targetCredits
            })
            .select('credits')
            .maybeSingle();

          if (!insertError && newProfile) {
            profile = newProfile;
          }
        } else {
          // Actualizar créditos en perfil existente
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ credits: targetCredits })
            .eq('id', user.id)
            .select('credits')
            .maybeSingle();

          if (!updateError && updatedProfile) {
            profile = updatedProfile;
          }
        }

        // Marcar metadata del usuario de Supabase Auth para evitar duplicados
        if (!welcomeCreditsGiven) {
          await supabase.auth.updateUser({
            data: { welcome_credits_given: true }
          });
        }
      }

      if (profile && typeof profile.credits === 'number') {
        setCredits(profile.credits);
        
        // Sincronizar de manera silenciosa compras anteriores pendientes de acreditar
        fetch('/api/sync-credits')
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.newlyCredited > 0) {
                setCredits(data.credits);
                console.log(`[Sincro Histórica] Se acreditaron automáticamente ${data.newlyCredited} créditos pendientes de compras anteriores.`);
              }
            }
          })
          .catch(err => console.warn('Error al sincronizar créditos históricos en segundo plano:', err));
      }
    };

    // 1. Verificar sesión inicial de Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Cargar configuraciones de localstorage para preferencias
      const savedVarsJson = localStorage.getItem('vto_global_variables');
      if (savedVarsJson) {
        try {
          const parsed = JSON.parse(savedVarsJson);
          setGlobalVars({
            prenda: parsed.prenda || '',
            fit: parsed.fit || '',
            tela: parsed.tela || '',
            pose: parsed.pose || '',
            resolution: parsed.resolution || '4:5',
            keyWords: parsed.keyWords || ''
          });
        } catch (e) {
          console.error('Error al cargar variables de localStorage:', e);
        }
      }

      if (user) {
        syncUserSession(user);
      }
    });

    // 2. Escuchar cambios de estado en tiempo real (Login, Registro, SignOut, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      syncUserSession(user);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    localStorage.setItem('vto_global_variables', JSON.stringify(globalVars));
  };

  const fetchModels = async () => {};
  const handleKeyChange = () => {};

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // return only base64 data
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFiles = async (files: FileList | null, type: 'anchors' | 'models', instIdx: number) => {
    if (!files) return;
    const newImages: LocalImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const base64 = await getBase64(file);
      newImages.push({ file, previewUrl, base64, mimeType: file.type });
    }
    
    setInstances(prev => {
      const copy = [...prev];
      if (type === 'anchors') copy[instIdx].anchorImages = [...copy[instIdx].anchorImages, ...newImages];
      else copy[instIdx].modelImages = [...copy[instIdx].modelImages, ...newImages];
      return copy;
    });
  };

  const addFromGallery = async (path: string, type: 'anchors' | 'models', instIdx: number) => {
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      const file = new File([blob], path.split('/').pop() || 'image.jpg', { type: blob.type });
      const previewUrl = URL.createObjectURL(file);
      const base64 = await getBase64(file);
      const localImg = { file, previewUrl, base64, mimeType: file.type };
      
      setInstances(prev => {
        const copy = [...prev];
        if (type === 'anchors') copy[instIdx].anchorImages = [...copy[instIdx].anchorImages, localImg];
        else copy[instIdx].modelImages = [...copy[instIdx].modelImages, localImg];
        return copy;
      });
    } catch (error) {
      console.error("Error loading gallery image", error);
    }
  };



  const startProcessing = async () => {
    const totalImages = instances.reduce((acc, inst) => acc + inst.modelImages.length, 0);

    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    if (credits < totalImages && !isUnlimited) {
      return alert(`No tienes créditos suficientes para procesar el lote. Requiere ${totalImages} créditos, pero solo posees ${credits}. Por favor compra créditos.`);
    }
    if (instances.some(inst => inst.anchorImages.length === 0 || inst.modelImages.length === 0)) {
      return alert('Faltan imágenes (ancla o modelo) en alguna instancia');
    }

    saveSettings();
    setIsProcessing(true);
    setResults([]);
    setProcessErrors([]);
    setProgress(0);
    
    let completed = 0;

    for (let instIdx = 0; instIdx < instances.length; instIdx++) {
      const inst = instances[instIdx];
      const anchorsParts = inst.anchorImages.map(img => ({ mimeType: img.mimeType!, base64: img.base64! }));

      for (let i = 0; i < inst.modelImages.length; i++) {
        const modelImg = inst.modelImages[i];
        const modelPart = { mimeType: modelImg.mimeType!, base64: modelImg.base64! };
        
        setStatusText(`Procesando modelo ${completed+1}/${totalImages}...`);
        
        let res;
        if (apiKey) {
          // Modo Gratis con API Key del cliente
          const payload = {
            apiKey,
            modelName: selectedModel,
            prompt: compilePrompt(globalVars, inst.variables),
            anchors: anchorsParts,
            modelPhoto: modelPart
          };
          res = await processTryOn(payload);
        } else {
          // Modo Créditos con API Key del Servidor
          const payload = {
            modelName: selectedModel,
            prompt: compilePrompt(globalVars, inst.variables),
            anchors: anchorsParts,
            modelPhoto: modelPart
          };
          
          try {
            const apiRes = await fetch('/api/try-on', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            res = await apiRes.json();
            if (res.success) {
              setCredits(prev => Math.max(0, prev - 1));
            }
          } catch (e: unknown) {
            const errMsg = e instanceof Error ? e.message : 'Error de conexión con el servidor.';
            res = { success: false, error: errMsg };
          }
        }

        if (res.success && res.base64 && res.mimeType) {
          const safeTitle = inst.title ? inst.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `inst${instIdx+1}`;
          const filename = `vto_${safeTitle}_model${i+1}.jpg`;
          const newItem: ResultItem = {
            filename,
            base64: res.base64,
            mimeType: res.mimeType,
            originalB64: modelPart.base64,
            originalMime: modelPart.mimeType,
            instanceIndex: instIdx
          };
          setResults(prev => [...prev, newItem]);
        } else {
          console.error('Error in processing:', res.error);
          setProcessErrors(prev => [...prev, `Error en ${inst.title || `Instancia ${instIdx+1}`}, modelo ${i+1}: ${res.error}`]);
        }
        completed++;
        setProgress((completed / totalImages) * 100);
      }
    }
    
    setIsProcessing(false);
    setStatusText('');
  };

  const downloadAllZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r, idx) => {
      zip.file(`tryon_${idx+1}.jpg`, r.base64, { base64: true });
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'virtual_tryon_results.zip');
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 py-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-2">
          Fit Lab
        </h1>
        <p className="text-muted-foreground">Crea lookbooks profesionales mediante IA generativa</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Row: Credits Info & Purchase (Elongated & Collapsable) */}
        {showCredits ? (
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm relative overflow-hidden">
            <button 
              onClick={() => setShowCredits(false)} 
              className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground cursor-pointer z-10"
              title="Ocultar créditos"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Coins size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Créditos de Fit Lab</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-primary">{isUnlimited ? '∞ (Ilimitados)' : credits}</span>
                  <span className="text-xs text-muted-foreground">fotos disponibles para generar lookbooks</span>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto pr-6 md:pr-0">
              <Button
                onClick={handleBuyCredits}
                disabled={isCheckoutLoading}
                className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-6 rounded-xl transition duration-300 shadow-md flex items-center justify-center gap-2 text-xs"
              >
                {isCheckoutLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Coins size={14} /> Comprar 100 Créditos ($10.000)
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end mt-[-10px] mb-[10px]">
            <button 
              onClick={() => setShowCredits(true)} 
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Coins size={12} /> Mostrar panel de créditos
            </button>
          </div>
        )}

        {/* Variables Globales Accordion */}
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm transition-all duration-200 mb-6">
          <button
            type="button"
            onClick={() => setShowGlobalVars(!showGlobalVars)}
            className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition font-semibold text-base text-foreground border-b border-border"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5 animate-pulse" />
              <span>Variables Globales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-normal">
                {showGlobalVars ? 'Ocultar' : 'Mostrar'}
              </span>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  showGlobalVars ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {showGlobalVars && (
            <div className="p-4 flex flex-col gap-5 bg-card">
              <VariableSelector
                label="Descripción de la Prenda"
                options={PRENDA_OPTIONS}
                value={globalVars.prenda}
                onChange={(val) => updateGlobalVars(prev => ({ ...prev, prenda: val }))}
              />
              <VariableSelector
                label="Fit/Corte"
                options={FIT_OPTIONS}
                value={globalVars.fit}
                onChange={(val) => updateGlobalVars(prev => ({ ...prev, fit: val }))}
              />
              <VariableSelector
                label="Tipo de Tela"
                options={TELA_OPTIONS}
                value={globalVars.tela}
                onChange={(val) => updateGlobalVars(prev => ({ ...prev, tela: val }))}
              />
              <VariableSelector
                label="Descripción de la Pose"
                options={POSE_OPTIONS}
                value={globalVars.pose}
                onChange={(val) => updateGlobalVars(prev => ({ ...prev, pose: val }))}
              />
              <VariableSelector
                label="Resolución"
                options={RESOLUTION_OPTIONS}
                value={globalVars.resolution}
                onChange={(val) => updateGlobalVars(prev => ({ ...prev, resolution: val }))}
              />
              <VariableSelector
                label="Key Words (Palabras Clave)"
                options={KEY_WORDS_OPTIONS}
                value={globalVars.keyWords}
                onChange={(val) => updateGlobalVars(prev => ({ ...prev, keyWords: val }))}
              />
            </div>
          )}
        </div>

        {/* Instances Drop zones */}
        <div className="flex flex-col">
          {instances.map((inst, instIdx) => (
            <div key={inst.id} className="py-8 border-b border-border first:pt-0 last:border-b-0">
              <div className="flex justify-between items-center mb-4">
                <Input 
                  value={inst.title} 
                  onChange={e => setInstances(prev => { const copy = [...prev]; copy[instIdx].title = e.target.value; return copy; })}
                  className="text-xl font-bold bg-transparent border-none shadow-none focus-visible:ring-1 w-1/2 p-0 h-auto"
                  placeholder={`Instancia ${instIdx + 1}`}
                />
                {instances.length > 1 && (
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setInstances(prev => prev.filter((_, i) => i !== instIdx))}>
                    Eliminar
                  </Button>
                )}
              </div>
              {/* Variables de Instancia Accordion */}
              <div className="mb-6 border border-border/85 rounded-lg overflow-hidden bg-muted/5">
                <button
                  type="button"
                  onClick={() => toggleInstanceAccordion(inst.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/10 hover:bg-muted/20 transition text-sm font-semibold text-foreground border-b border-border/60"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Variables de Instancia</span>
                    {inst.variables && Object.keys(inst.variables).some(k => inst.variables?.[k as keyof VtoVariables] !== undefined) && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold animate-pulse">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-normal">
                      {openInstances[inst.id] ? 'Cerrar' : 'Configurar'}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        openInstances[inst.id] ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>

                {openInstances[inst.id] && (
                  <div className="p-4 flex flex-col gap-5 bg-background/50">
                    <InstanceVariableSelector
                      label="Descripción de la Prenda"
                      options={PRENDA_OPTIONS}
                      globalValue={globalVars.prenda}
                      overrideValue={inst.variables?.prenda}
                      onChange={(val) => setInstances(prev => {
                        const copy = [...prev];
                        copy[instIdx].variables = { ...copy[instIdx].variables, prenda: val };
                        return copy;
                      })}
                    />
                    <InstanceVariableSelector
                      label="Fit/Corte"
                      options={FIT_OPTIONS}
                      globalValue={globalVars.fit}
                      overrideValue={inst.variables?.fit}
                      onChange={(val) => setInstances(prev => {
                        const copy = [...prev];
                        copy[instIdx].variables = { ...copy[instIdx].variables, fit: val };
                        return copy;
                      })}
                    />
                    <InstanceVariableSelector
                      label="Tipo de Tela"
                      options={TELA_OPTIONS}
                      globalValue={globalVars.tela}
                      overrideValue={inst.variables?.tela}
                      onChange={(val) => setInstances(prev => {
                        const copy = [...prev];
                        copy[instIdx].variables = { ...copy[instIdx].variables, tela: val };
                        return copy;
                      })}
                    />
                    <InstanceVariableSelector
                      label="Descripción de la Pose"
                      options={POSE_OPTIONS}
                      globalValue={globalVars.pose}
                      overrideValue={inst.variables?.pose}
                      onChange={(val) => setInstances(prev => {
                        const copy = [...prev];
                        copy[instIdx].variables = { ...copy[instIdx].variables, pose: val };
                        return copy;
                      })}
                    />
                    <InstanceVariableSelector
                      label="Resolución"
                      options={RESOLUTION_OPTIONS}
                      globalValue={globalVars.resolution}
                      overrideValue={inst.variables?.resolution}
                      onChange={(val) => setInstances(prev => {
                        const copy = [...prev];
                        copy[instIdx].variables = { ...copy[instIdx].variables, resolution: val };
                        return copy;
                      })}
                    />
                    <InstanceVariableSelector
                      label="Key Words (Palabras Clave)"
                      options={KEY_WORDS_OPTIONS}
                      globalValue={globalVars.keyWords}
                      overrideValue={inst.variables?.keyWords}
                      onChange={(val) => setInstances(prev => {
                        const copy = [...prev];
                        copy[instIdx].variables = { ...copy[instIdx].variables, keyWords: val };
                        return copy;
                      })}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                {/* Anchors */}
                <div>
                  <div className="flex justify-between mb-2 items-center h-6">
                    <div className="flex items-center gap-1.5">
                      <Label className="mb-0 font-semibold">Imágenes Ancla (Prendas)</Label>
                    </div>
                    <button onClick={() => setInstances(prev => { const copy = [...prev]; copy[instIdx].anchorImages = []; return copy; })} className="text-destructive hover:text-red-500 flex items-center"><Trash2 size={16}/></button>
                  </div>
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors relative"
                    onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.multiple = true;
                       input.accept = 'image/*';
                       input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files, 'anchors', instIdx);
                       input.click();
                    }}
                  >
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs">Arrastrar o click para seleccionar</span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar abrir el explorador de archivos estándar
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.setAttribute('capture', 'environment');
                        input.onchange = (ev) => handleFiles((ev.target as HTMLInputElement).files, 'anchors', instIdx);
                        input.click();
                      }}
                      className="absolute bottom-2 right-2 bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-full shadow-md z-10 transition hover:scale-105"
                      title="Tomar foto con la cámara"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  <div className="mt-4">
                    <button onClick={() => setShowClothesGallery(!showClothesGallery)} className="text-xs text-muted-foreground font-semibold hover:underline flex items-center gap-1 mb-2">
                      {showClothesGallery ? '▼ Ocultar galería' : '▶ Elegir prenda de la galería'}
                    </button>
                    {showClothesGallery && (
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {DEFAULT_CLOTHES.map((path, idx) => (
                          <div key={idx} className="relative group shrink-0 cursor-pointer">
                            <img src={path} onClick={() => addFromGallery(path, 'anchors', instIdx)} className="w-16 h-16 object-cover rounded border group-hover:border-primary" alt="Clothes" />
                            <button onClick={(e) => { e.stopPropagation(); setPreviewImages(DEFAULT_CLOTHES); setPreviewIndex(idx); setPreviewInstIdx(instIdx); }} className="absolute bottom-1 right-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary">
                              <Eye size={12} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {inst.anchorImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2 pt-2 pr-2">
                      {inst.anchorImages.map((img, idx) => (
                        <div key={idx} className="relative group shrink-0">
                          <img src={img.previewUrl} className="w-16 h-16 object-cover rounded-md border" />
                          <button onClick={(e) => { e.stopPropagation(); setPreviewImages(inst.anchorImages.map(a => a.previewUrl)); setPreviewIndex(idx); }} className="absolute bottom-1 right-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary cursor-pointer">
                            <Eye size={12} className="text-white" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setInstances(prev => { const copy = [...prev]; copy[instIdx].anchorImages = copy[instIdx].anchorImages.filter((_, i) => i !== idx); return copy; }); }} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-md">
                            <X size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Models */}
                <div>
                  <div className="flex justify-between mb-2 items-center h-6">
                    <div className="flex items-center gap-1.5">
                      <Label className="mb-0 font-semibold">Imágenes Modelo</Label>
                      <div className="relative group/tooltip">
                        <button type="button" className="text-muted-foreground hover:text-foreground flex items-center">
                          <Info size={14} />
                        </button>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block bg-popover text-popover-foreground border shadow-lg rounded-lg p-3 text-xs w-64 z-30 leading-relaxed animate-in fade-in zoom-in-95 duration-100">
                          Puedes buscar fotos de stock gratuitas en:
                          <div className="flex flex-col gap-1 mt-1.5 font-semibold">
                            <a href="https://www.shopify.com/stock-photos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              Shopify Stock Photos ↗
                            </a>
                            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              Pexels ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setInstances(prev => { const copy = [...prev]; copy[instIdx].modelImages = []; return copy; })} className="text-destructive hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors relative"
                    onClick={() => {
                       const input = document.createElement('input');
                       input.type = 'file';
                       input.multiple = true;
                       input.accept = 'image/*';
                       input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files, 'models', instIdx);
                       input.click();
                    }}
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs">Arrastrar o click para seleccionar</span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar abrir el explorador de archivos estándar
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.setAttribute('capture', 'environment');
                        input.onchange = (ev) => handleFiles((ev.target as HTMLInputElement).files, 'models', instIdx);
                        input.click();
                      }}
                      className="absolute bottom-2 right-2 bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-full shadow-md z-10 transition hover:scale-105"
                      title="Tomar foto con la cámara"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  <div className="mt-4">
                    <button onClick={() => setShowModelsGallery(!showModelsGallery)} className="text-xs text-muted-foreground font-semibold hover:underline flex items-center gap-1 mb-2">
                      {showModelsGallery ? '▼ Ocultar galería' : '▶ Elegir modelo de la galería'}
                    </button>
                    {showModelsGallery && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {DEFAULT_MODELS.map((path, idx) => (
                          <div key={idx} className="relative group shrink-0 cursor-pointer">
                            <img src={path} onClick={() => addFromGallery(path, 'models', instIdx)} className="w-16 h-20 aspect-[4/5] object-cover rounded border group-hover:border-primary" alt="Model" />
                            <button onClick={(e) => { e.stopPropagation(); setPreviewImages(DEFAULT_MODELS); setPreviewIndex(idx); setPreviewInstIdx(instIdx); }} className="absolute bottom-1 right-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary">
                              <Eye size={12} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {inst.modelImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2 pt-2 pr-2">
                      {inst.modelImages.map((img, idx) => (
                        <div key={idx} className="relative group shrink-0">
                          <img src={img.previewUrl} className="w-16 h-20 aspect-[4/5] object-cover rounded-md border" />
                          <button onClick={(e) => { e.stopPropagation(); setPreviewImages(inst.modelImages.map(m => m.previewUrl)); setPreviewIndex(idx); }} className="absolute bottom-1 right-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary cursor-pointer">
                            <Eye size={12} className="text-white" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setInstances(prev => { const copy = [...prev]; copy[instIdx].modelImages = copy[instIdx].modelImages.filter((_, i) => i !== idx); return copy; }); }} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-md">
                            <X size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button onClick={() => setInstances(prev => [...prev, { id: `inst-${Date.now()}`, title: `Instancia ${prev.length + 1}`, anchorImages: [], modelImages: [], variables: {} }])} variant="outline" className="w-full border-dashed py-8 mt-2">
          + Agregar Instancia
        </Button>
      </div>

      <Button onClick={startProcessing} disabled={isProcessing} className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90">
        {isProcessing ? `${statusText} ${Math.round(progress)}%` : 'PROCESAR COMBINACIONES'}
      </Button>

      {/* Errors */}
      {processErrors.length > 0 && (
        <div className="bg-destructive/15 border-l-4 border-destructive p-4 rounded-md mt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-destructive font-bold flex items-center gap-2">
               <Info size={18}/> Hubo errores durante el procesamiento
            </h3>
            <button onClick={() => setProcessErrors([])} className="text-destructive hover:underline text-sm font-semibold">Cerrar</button>
          </div>
          <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
            {processErrors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Resultados Generados</h2>
            <Button onClick={downloadAllZip} variant="secondary" className="gap-2">
              <Download size={16}/> Descargar Todo (.ZIP)
            </Button>
          </div>
          <div className="space-y-8">
            {Array.from(new Set(results.map(r => r.instanceIndex))).map(instIdx => (
              <div key={instIdx}>
                <h3 className="text-xl font-bold mb-4">Resultados {instances[instIdx]?.title || `Instancia ${instIdx + 1}`}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.filter(r => r.instanceIndex === instIdx).map((r, idx) => {
                     const globalIdx = results.findIndex(globalR => globalR === r);
                     return (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border bg-card cursor-pointer" onClick={() => { setViewerIndex(globalIdx); setShowOriginal(false); setShowCompare(false); setZoom(1); setShowReprocess(false); }}>
                        <img src={`data:${r.mimeType};base64,${r.base64}`} className="w-full aspect-[4/5] object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-semibold">Ver</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {viewerIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center" onClick={() => {if (!showReprocess) setViewerIndex(null)}}>
          <div className="absolute top-4 left-4 z-[60]">
             <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold text-sm">
               {instances[results[viewerIndex].instanceIndex]?.title || `Instancia ${results[viewerIndex].instanceIndex + 1}`}
             </span>
          </div>
          <div className="absolute top-4 right-4 flex gap-4 z-[60]" onClick={e => e.stopPropagation()}>
            <Button 
              variant={showCompare ? "default" : "outline"} 
              size="lg" 
              className={`font-bold border-2 border-white/20 ${showCompare ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-black/50 text-white hover:bg-black/80 hover:text-white'}`} 
              onClick={() => { 
                setShowCompare(!showCompare); 
                setZoom(1); 
              }}
            >
              COMPARAR
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="font-bold border-2 border-white/20 bg-black/50 text-white hover:bg-black/80 hover:text-white" 
              onClick={() => { 
                if (showCompare) {
                  setShowCompare(false);
                  setShowOriginal(true);
                } else {
                  setShowOriginal(!showOriginal); 
                }
                setZoom(1); 
              }}
            >
              {showCompare ? 'VER ORIGINAL' : (showOriginal ? 'VER RESULTADO' : 'VER ORIGINAL')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewerIndex(null)} className="text-white">
              <X size={32} />
            </Button>
          </div>

          {viewerIndex > 0 && !showReprocess && (
            <button onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex - 1); setZoom(1); }} className="absolute left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-50">
               <ChevronLeft size={32} />
            </button>
          )}

          {viewerIndex < results.length - 1 && !showReprocess && (
            <button onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex + 1); setZoom(1); }} className="absolute right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-50">
               <ChevronRight size={32} />
            </button>
          )}

          {!showReprocess && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 px-4 py-2 rounded-full z-50 border border-white/20" onClick={e => e.stopPropagation()}>
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="text-white hover:text-primary"><ZoomOut size={20}/></button>
                <span className="text-white text-xs font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="text-white hover:text-primary"><ZoomIn size={20}/></button>
                <div className="w-px h-6 bg-white/30 mx-1"></div>
                <button onClick={() => setShowReprocess(true)} className="text-white hover:text-primary flex items-center gap-2 text-sm font-semibold pl-1">
                  <RefreshCw size={16}/> Reprocesar
                </button>
             </div>
          )}

          <div className="w-[90vw] h-[90vh] flex items-center justify-center p-4 overflow-auto relative">
            {showReprocess ? (
               <div className="bg-card p-6 rounded-xl border shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in zoom-in-95 z-50" onClick={e => e.stopPropagation()}>
                 <h3 className="text-xl font-bold">Reprocesar Imagen</h3>
                 
                 <div>
                   <Label>Foto Base para Reprocesar</Label>
                   <div className="flex gap-2 mt-2">
                     <Button variant={reprocessSource === 'original' ? 'default' : 'outline'} onClick={() => setReprocessSource('original')} className="flex-1">Original</Button>
                     <Button variant={reprocessSource === 'generated' ? 'default' : 'outline'} onClick={() => setReprocessSource('generated')} className="flex-1">Generada</Button>
                   </div>
                 </div>

                 <div className="flex gap-4 mt-2">
                   <Button variant="ghost" onClick={() => setShowReprocess(false)}>Cancelar</Button>
                   <Button className="flex-1 bg-primary text-primary-foreground font-bold" onClick={async () => {
                     const sourceB64 = reprocessSource === 'original' ? results[viewerIndex].originalB64 : results[viewerIndex].base64;
                     const sourceMime = reprocessSource === 'original' ? results[viewerIndex].originalMime : results[viewerIndex].mimeType;
                     
                     // Convert b64 back to file just to be safe, or just insert as LocalImage
                     const fetchRes = await fetch(`data:${sourceMime};base64,${sourceB64}`);
                     const blob = await fetchRes.blob();
                     const file = new File([blob], 'reprocess.jpg', { type: sourceMime });
                     const localImg = { file, previewUrl: `data:${sourceMime};base64,${sourceB64}`, base64: sourceB64, mimeType: sourceMime };
                     
                     // We add it to the same instance it came from!
                     setInstances(prev => {
                        const copy = [...prev];
                        copy[results[viewerIndex].instanceIndex].modelImages = [localImg];
                        return copy;
                     });
                     
                     setViewerIndex(null);
                     setShowReprocess(false);
                     setTimeout(() => startProcessing(), 100);
                   }}>
                     <RefreshCw size={16} className="mr-2" /> Procesar de Nuevo
                   </Button>
                 </div>
               </div>
             ) : showCompare ? (
                <div 
                  className="flex flex-col md:flex-row gap-6 max-w-full max-h-full items-center justify-center transition-transform duration-200" 
                  style={{ transform: `scale(${zoom})` }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider backdrop-blur-sm shadow-md">Original</span>
                    <img 
                      src={`data:${results[viewerIndex].originalMime};base64,${results[viewerIndex].originalB64}`} 
                      className="max-h-[35vh] md:max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10" 
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-white text-xs font-semibold bg-primary/95 text-primary-foreground px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wider backdrop-blur-sm shadow-md">Resultado</span>
                    <img 
                      src={`data:${results[viewerIndex].mimeType};base64,${results[viewerIndex].base64}`} 
                      className="max-h-[35vh] md:max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10" 
                    />
                  </div>
                </div>
             ) : (
                <img 
                  src={`data:${showOriginal ? results[viewerIndex].originalMime : results[viewerIndex].mimeType};base64,${showOriginal ? results[viewerIndex].originalB64 : results[viewerIndex].base64}`} 
                  className="max-w-full max-h-full object-contain rounded-md shadow-2xl transition-transform duration-200" 
                  style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'move' : 'default' }}
                  onClick={e => e.stopPropagation()}
                />
             )}
          </div>
        </div>
      )}

      {/* Generic Preview Modal */}
      {previewImages && previewIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center" onClick={() => setPreviewImages(null)}>
           <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-[110]" onClick={() => setPreviewImages(null)}>
             <X size={24} />
           </Button>
           {previewIndex > 0 && (
             <button onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex - 1); }} className="absolute left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-[110]">
                <ChevronLeft size={32} />
             </button>
           )}
           {previewIndex < previewImages.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex + 1); }} className="absolute right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-[110]">
                <ChevronRight size={32} />
             </button>
           )}
           <div className="w-[90vw] h-[90vh] flex items-center justify-center p-4">
             <img src={previewImages[previewIndex]} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" onClick={e => e.stopPropagation()} />
           </div>
           
           {previewImages === DEFAULT_CLOTHES && previewInstIdx !== null && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110]" onClick={e => e.stopPropagation()}>
               <Button onClick={() => { addFromGallery(previewImages[previewIndex], 'anchors', previewInstIdx); setPreviewImages(null); }} className="bg-primary text-white font-bold px-8 shadow-xl">
                 + Usar esta Prenda
               </Button>
             </div>
           )}

           {previewImages === DEFAULT_MODELS && previewInstIdx !== null && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110]" onClick={e => e.stopPropagation()}>
               <Button onClick={() => { addFromGallery(previewImages[previewIndex], 'models', previewInstIdx); setPreviewImages(null); }} className="bg-primary text-white font-bold px-8 shadow-xl">
                 + Usar este Modelo
               </Button>
             </div>
           )}
        </div>
      )}

      {/* Modern Premium Informative Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className="bg-card border rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center gap-2 mt-2">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
                <Coins size={32} className="animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Inicia Sesión en Fit Lab</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Para poder adquirir paquetes de créditos o generar imágenes utilizando el servidor seguro, necesitas registrarte o iniciar sesión de manera rápida y gratuita.
              </p>
              <div className="mt-2 bg-primary/10 border border-primary/20 p-3 rounded-xl text-xs text-primary max-w-xs font-semibold">
                🎁 ¡Regístrate ahora y obtén 5 créditos de regalo de bienvenida al instante!
              </div>
            </div>

            {loginError && (
              <div className="bg-destructive/15 border border-destructive/20 p-3 rounded-xl text-xs text-destructive text-left animate-in fade-in slide-in-from-top-2 flex gap-2 items-start mx-1 mt-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Error de Autenticación:</p>
                  <p className="text-muted-foreground">{loginError}</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <Button 
                onClick={() => {
                  setShowAuthModal(false);
                  window.dispatchEvent(new CustomEvent('open-login-sidebar'));
                }} 
                className="w-full font-bold shadow-lg"
              >
                Abrir Menú de Iniciar Sesión / Registro
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowAuthModal(false)} 
                className="w-full text-muted-foreground"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
