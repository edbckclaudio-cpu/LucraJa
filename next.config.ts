import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Habilita a exportação estática. 
     O Capacitor carregará esses arquivos diretamente do armazenamento do celular.
  */
  output: 'export', 
  
  /* Imagens precisam ser desotimizadas para funcionar em exportação estática,
     já que não haverá um servidor Node.js para processá-las em tempo de execução.
  */
  images: {
    unoptimized: true,
  },

  /*
     Garante que links como /sobre funcionem como /sobre.html internamente no Android.
  */
  trailingSlash: true,
};

export default nextConfig;