// client/src/util/ghanaSchools.js

export const GHANA_SCHOOLS = [
  // GREATER ACCRA
  "PRESEC Legon",
  "Achimota School",
  "Accra Academy",
  "St. Thomas Aquinas SHS",
  "Accra Girls SHS",
  "St. Mary's SHS (Korle Gonno)",
  "Tema International School",
  "Ghana International School (GIS)",
  "Christian Methodist SHS",
  
  // CENTRAL REGION (The Giants)
  "Wesley Girls' High School",
  "Mfantsipim School",
  "Adisadel College",
  "St. Augustine's College",
  "Holy Child School",
  "Mfantsiman Girls' SHS",
  "Aggrey Memorial Zion SHS",
  "Ghana National College",
  
  // ASHANTI REGION
  "Prempeh College",
  "Opoku Ware School",
  "Yaa Asantewaa Girls' SHS",
  "St. Louis SHS",
  "Kumasi High School",
  "Kumasi Academy",
  "T.I. Ahmadiyya SHS (Kumasi)",
  "Anglican SHS (KASS)",
  
  // EASTERN REGION
  "Aburi Girls' SHS",
  "Pope John SHS and Minor Seminary",
  "St. Peter's SHS (PERSCO)",
  "Koforidua Sec. Tech. (SECTECH)",
  "Ofori Panin SHS",
  "Krobo Girls' SHS",
  
  // VOLTA REGION
  "Mawuli School",
  "Keta SHTS (KETASCO)",
  "OLA Girls SHS (Ho)",
  "Bishop Herman College",
  "Awudome SHS",
  
  // WESTERN REGION
  "Ghana Secondary Technical School (GSTS)",
  "Fijai SHS",
  "Archbishop Porter Girls' SHS",
  "St. John's School (Sekondi)",
  
  // NORTHERN, BONO & OTHERS
  "Tamale SHS (TAMASCO)",
  "Ghana SHS (GHANASCO - Tamale)",
  "Sunyani SHS",
  "St. James Seminary SHS",
  "Navrongo SHS (NAVASCO)",
  "Bolgatanga SHS (BIG BOSS)",

  // THE FALLBACK
  "Other (Not Listed)"
].sort((a, b) => {
  // Keep "Other" at the very bottom, sort the rest alphabetically
  if (a === "Other (Not Listed)") return 1;
  if (b === "Other (Not Listed)") return -1;
  return a.localeCompare(b);
});