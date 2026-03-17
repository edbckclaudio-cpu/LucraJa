import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { supabase } from '@/lib/supabase';

export const useRevenueCat = () => {
  
  const setupRevenueCat = async (userEmail: string) => {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    // Substitua pela sua API Key do Dashboard da RevenueCat
    await Purchases.configure({ 
        apiKey: "goog_sua_api_key_aqui", 
        appUserID: userEmail 
    });
  };

  const getPackages = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
    } catch (e) {
      console.error("Erro ao buscar ofertas:", e);
    }
    return [];
  };

  const buyPackage = async (pack: any) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pack });
      
      // Se a compra foi confirmada, avisamos o Supabase
      if (typeof customerInfo.entitlements.active['premium_access'] !== "undefined") {
        return { success: true };
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Erro na compra:", e);
      }
    }
    return { success: false };
  };

  return { setupRevenueCat, getPackages, buyPackage };
};