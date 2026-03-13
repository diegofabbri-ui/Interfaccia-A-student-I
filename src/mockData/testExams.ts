export const mockExams = [
  {
    id: 'mock-fisica-1',
    esame_scelto: 'Fisica Sperimentale 1',
    universita: 'Politecnico di Torino',
    facolta: 'Ingegneria Aerospaziale',
    anno_universita: '1° Anno',
    libri_supporto: [
      JSON.stringify({
        nome: 'Fisica Generale - Meccanica e Termodinamica (Focardi, Massa, Uguzzoni)',
        suddivisioni: [
          'Capitolo 1: Grandezze fisiche e vettori', 
          'Capitolo 2: Cinematica del punto', 
          'Capitolo 3: Dinamica del punto materiale', 
          'Capitolo 4: Lavoro ed energia', 
          'Capitolo 5: Sistemi di punti materiali e urti'
        ],
        fileUrls: []
      }),
      JSON.stringify({
        nome: 'Problemi di Fisica Generale (Mencuccini, Silvestrini)',
        suddivisioni: [
          'Esercizi 1-20: Cinematica', 
          'Esercizi 21-50: Dinamica', 
          'Esercizi 51-80: Conservazione dell\'energia'
        ],
        fileUrls: []
      })
    ],
    link_supporto: [
      'https://www.youtube.com/watch?v=lezione_cinematica_polito',
      'https://it.wikipedia.org/wiki/Principi_della_dinamica',
      'https://phet.colorado.edu/it/simulations/forces-and-motion-basics',
      'https://www.infn.it/educational/fisica_base'
    ],
    mock_notes: [
      'Appunti_Lez01_Introduzione_Vettori.pdf',
      'Appunti_Lez02_Cinematica_1D_2D.pdf',
      'Appunti_Lez03_Leggi_di_Newton.pdf',
      'Appunti_Lez04_Attrito_e_Piani_Inclinati.pdf',
      'Dimostrazione_Teorema_Forze_Vive.pdf',
      'Formulario_Meccanica_Completo_v2.pdf',
      'Esercitazione_Guidata_Pendolo.pdf'
    ]
  },
  {
    id: 'mock-storia-arte',
    esame_scelto: 'Storia dell\'Arte Contemporanea',
    universita: 'Università degli Studi di Milano',
    facolta: 'Beni Culturali',
    anno_universita: '3° Anno',
    libri_supporto: [
      JSON.stringify({
        nome: 'L\'arte contemporanea. Da Cézanne alle ultime tendenze (Barilli)',
        suddivisioni: [
          'Capitolo 1: I post-impressionisti', 
          'Capitolo 2: L\'Espressionismo e i Fauves', 
          'Capitolo 3: Il Cubismo', 
          'Capitolo 4: Il Futurismo', 
          'Capitolo 5: L\'Astrattismo'
        ],
        fileUrls: []
      })
    ],
    link_supporto: [
      'https://www.moma.org/collection/',
      'https://www.guggenheim.org/artwork/movement/cubism',
      'https://www.youtube.com/watch?v=documentario_picasso'
    ],
    mock_notes: [
      'Sbobinatura_Lezione_1_Cezanne.docx',
      'Sbobinatura_Lezione_2_VanGogh_Gauguin.docx',
      'Slide_Prof_03_Cubismo_Analitico_Sintetico.pdf',
      'Riassunto_Manifesto_Futurista.pdf',
      'Analisi_Opera_Guernica.pdf'
    ]
  }
];
