// Aides du formulaire : exemples de titre et conseils de description, selon la catégorie
const H = {
  auto: { t: ['Ex. Toyota Corolla 2008, 144 000 km, très bon état', 'مثال: تويوتا كورولا 2008، 144 ألف كم، حالة ممتازة'],
    d: ['Année, kilométrage, état, entretien, options, raison de la vente', 'السنة، عدد الكيلومترات، الحالة، الصيانة، الخيارات، سبب البيع'] },
  immo: { t: ['Ex. Appartement 3 pièces, Tevragh Zeina, avec parking', 'مثال: شقة 3 غرف، تفرغ زينة، مع موقف سيارات'],
    d: ['Surface, nombre de pièces, étage, état, papiers, accès, environnement', 'المساحة، عدد الغرف، الطابق، الحالة، الأوراق، الوصول، المحيط'] },
  phone: { t: ['Ex. Samsung A54 128 Go, comme neuf', 'مثال: سامسونغ A54 128 غيغا، كالجديد'],
    d: ['Stockage, état de l\'écran et de la batterie, accessoires, garantie', 'السعة، حالة الشاشة والبطارية، الملحقات، الضمان'] },
  multi: { t: ['Ex. Ordinateur portable i5, 8 Go de RAM', 'مثال: حاسوب محمول i5، 8 غيغا رام'],
    d: ['Marque, modèle, configuration, état, accessoires inclus', 'العلامة، الموديل، المواصفات، الحالة، الملحقات المرفقة'] },
  menager: { t: ['Ex. Réfrigérateur Samsung 300 L, bon état', 'مثال: ثلاجة سامسونغ 300 لتر، حالة جيدة'],
    d: ['Marque, capacité, année d\'achat, état de fonctionnement, garantie', 'العلامة، السعة، سنة الشراء، حالة التشغيل، الضمان'] },
  anim: { t: ['Ex. Deux moutons Tabaski, bien nourris', 'مثال: خروفان للعيد، مغذيان جيدا'],
    d: ['Âge, poids, vaccination, origine, santé, livraison possible', 'العمر، الوزن، التطعيم، الأصل، الصحة، إمكانية التوصيل'] },
  maison: { t: ['Ex. Canapé 3 places en cuir, très bon état', 'مثال: كنبة 3 مقاعد جلد، حالة ممتازة'],
    d: ['Dimensions, matière, état, date d\'achat, raison de la vente', 'الأبعاد، المادة، الحالة، تاريخ الشراء، سبب البيع'] },
  equip: { t: ['Ex. Ciment 50 kg, prix par sac', 'مثال: إسمنت 50 كغ، السعر للكيس'],
    d: ['Quantité disponible, marque, état, lieu de retrait, livraison', 'الكمية المتوفرة، العلامة، الحالة، مكان الاستلام، التوصيل'] },
  alim: { t: ['Ex. Dattes Mauritanie, caisse de 10 kg', 'مثال: تمر موريتاني، صندوق 10 كغ'],
    d: ['Origine, qualité, quantité, date de péremption, mode de vente', 'المصدر، الجودة، الكمية، تاريخ الانتهاء، طريقة البيع'] },
  mode: { t: ['Ex. Robe de soirée taille M, portée une fois', 'مثال: فستان سهرة مقاس M، لبس مرة واحدة'],
    d: ['Taille, marque, état, matière, couleur', 'المقاس، العلامة، الحالة، المادة، اللون'] },
  serv: { t: ['Ex. Plombier disponible à Nouakchott', 'مثال: سباك متوفر في نواكشوط'],
    d: ['Ce que vous proposez, zone couverte, disponibilité, tarif', 'ما تقدمه، المنطقة، التوفر، السعر'] },
  beaute: { t: ['Ex. Coffret parfum original, neuf sous emballage', 'مثال: علبة عطر أصلية، جديدة في غلافها'],
    d: ['Marque, contenance, date de péremption, état d\'emballage', 'العلامة، الحجم، تاريخ الانتهاء، حالة العلبة'] },
  fam: { t: ['Ex. Poussette bébé, très bon état', 'مثال: عربة أطفال، حالة ممتازة'],
    d: ['Âge conseillé, marque, état, sécurité, accessoires inclus', 'العمر المناسب، العلامة، الحالة، السلامة، الملحقات'] },
  job: { t: ['Ex. Chauffeur avec permis B, 5 ans d\'expérience', 'مثال: سائق برخصة B، خبرة 5 سنوات'],
    d: ['Poste, expérience, diplômes, disponibilité, conditions de travail', 'المنصب، الخبرة، الشهادات، التوفر، شروط العمل'] },
  covoit: { t: ['Ex. Nouakchott → Rosso, mardi 8h, 3 places', 'مثال: نواكشوط ← روصو، الثلاثاء 8 صباحا، 3 مقاعد'],
    d: ['Date et heure de départ, lieu de rendez-vous, prix par place, bagages', 'تاريخ ووقت المغادرة، مكان الموعد، سعر المقعد، الأمتعة'] },
  autre: { t: ['Ex. Ce que vous vendez, en quelques mots', 'مثال: ما تبيعه، في كلمات قليلة'],
    d: ['État, caractéristiques principales, raison de la vente', 'الحالة، المواصفات الرئيسية، سبب البيع'] },
};

// Aide sous le titre et sous la description, dans la langue du formulaire
export function hintsFor(cat, lang) {
  const h = H[cat] || H.autre;
  const i = lang === 'ar' ? 1 : 0;
  return { title: h.t[i], desc: h.d[i] };
}
