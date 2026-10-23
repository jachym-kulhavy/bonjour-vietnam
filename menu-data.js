/* ==========================================================================
   Bonjour Vietnam – data jídelního lístku
   --------------------------------------------------------------------------
   Upravujete jen tento soubor, HTML ani CSS se na lístek šahat nemusí.

   Jak to funguje
   - Každá kategorie má pole items. Pořadí v poli = pořadí na tabuli.
   - price: číslo (např. 189) nebo null. null = zobrazí se [DOPLNIT].
   - desc: krátký popis jídla, nebo prázdný text '' (pak se řádek nezobrazí).
   - diets: pole z 'vegan', 'vegetarian', 'gluten-free'. Podle něj filtruje web.
   - allergens: čísla alergenů 1–14 (viz seznam níž), např. [1, 3, 11].
   - Až doplníte všechny položky, přepněte placeholder na false.
     Zmizí upozornění nad tabulí.

   POZOR: položky níže jsou ZÁSTUPNÉ. Vycházejí jen z nabídky, kterou jste
   popsali (nudle, saláty, restovaná zelenina, rolky, dezerty, limonády).
   Obecné názvy (Salát, Limonáda, Originální dezert) nahraďte skutečnými jídly.
   Názvy jídel Bún bò Nam Bộ, phở a vietnamská káva jsou k potvrzení majitelkou.
   Diety u položek jsou ilustrativní a musí je potvrdit majitelka, alergeny
   zatím nejsou vyplněny vůbec.
   ========================================================================== */

window.MENU_DATA = {
  currency: 'Kč',
  placeholder: true,

  diets: [
    { id: 'vegan',       label: 'veganské' },
    { id: 'vegetarian',  label: 'vegetariánské' },
    { id: 'gluten-free', label: 'bez lepku' }
  ],

  /* Seznam 14 alergenů podle nařízení EU č. 1169/2011 (číslování používané v ČR) */
  allergens: {
    1:  'Obiloviny obsahující lepek',
    2:  'Korýši',
    3:  'Vejce',
    4:  'Ryby',
    5:  'Arašídy',
    6:  'Sója',
    7:  'Mléko',
    8:  'Skořápkové plody',
    9:  'Celer',
    10: 'Hořčice',
    11: 'Sezam',
    12: 'Oxid siřičitý a siřičitany',
    13: 'Lupina (vlčí bob)',
    14: 'Měkkýši'
  },

  categories: [
    {
      id: 'nudle',
      title: 'Nudle',
      items: [
        { name: 'Bún bò Nam Bộ', desc: '', price: null, diets: [], allergens: [] },
        { name: 'Phở',           desc: '', price: null, diets: [], allergens: [] }
      ]
    },
    {
      id: 'salaty',
      title: 'Saláty',
      items: [
        { name: 'Salát', desc: '', price: null, diets: ['vegan', 'vegetarian'], allergens: [] }
      ]
    },
    {
      id: 'zelenina',
      title: 'Restovaná zelenina',
      items: [
        { name: 'Restovaná zelenina', desc: '', price: null, diets: ['vegan', 'vegetarian'], allergens: [] }
      ]
    },
    {
      id: 'rolky',
      title: 'Rolky',
      items: [
        { name: 'Letní rolky', desc: '', price: null, diets: ['vegan', 'vegetarian', 'gluten-free'], allergens: [] },
        { name: 'Jarní rolky', desc: '', price: null, diets: ['vegetarian'], allergens: [] }
      ]
    },
    {
      id: 'dezerty',
      title: 'Dezerty',
      items: [
        { name: 'Originální dezert', desc: '', price: null, diets: [], allergens: [] }
      ]
    },
    {
      id: 'napoje',
      title: 'Nápoje',
      items: [
        { name: 'Limonáda',                              desc: '', price: null, diets: [], allergens: [] },
        { name: 'Vietnamská káva překapávaná v hrnku',    desc: '', price: null, diets: [], allergens: [] }
      ]
    }
  ]
};
