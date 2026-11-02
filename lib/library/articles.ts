/**
 * SikLo health library: 89 topics and 555 on-topic terms.
 *
 * GENERATED FILE - do not edit by hand.
 *
 * The library lives in backend/articles/*.md and is compiled by
 * `python -m siklo_knowledge.build` into this module, because a browser cannot
 * read the SQLite database the Python service uses. To add or change a topic,
 * edit the source file and run the build; the pipeline checks the rules that
 * keep the library safe (no doses, no diagnoses, no claims about "safe days")
 * before it will write this file.
 *
 * 0 of 89 topics have been signed off by a qualified professional.
 * The rest are team-written summaries pending review.
 */
export interface Article {
  id: string;
  title: string;
  /** Words someone might use to ask about this, in English, Filipino and Taglish. */
  keywords: string;
  text: string;
  /** True once a qualified professional has signed this topic off. */
  reviewed: boolean;
}

export const SOURCE_NOTE = 'SikLo health library (team-written summary, pending medical review)';

/** How many topics a professional has reviewed, of 89. */
export const REVIEWED_COUNT = 0;

export const ARTICLES: readonly Article[] = [
  {
    id: "acne",
    title: "Period acne",
    keywords: "acne, pimple, pimples, breakout, breakouts, skin, tagihawat, oily skin, chin acne",
    text:
      "Many people get breakouts in the days before their period because of hormone changes that make skin oilier. Gentle cleansing twice a day, not picking at pimples, and using non-greasy skin products can help. Breakouts often settle after the period starts. A healthcare professional or dermatologist can help if acne is severe, painful, or leaves scars.",
    reviewed: false,
  },
  {
    id: "adenomyosis",
    title: "Adenomyosis",
    keywords: "adenomyosis uterus lining muscle heavy painful enlarged",
    text:
      "Adenomyosis happens when tissue like the lining of the uterus grows into its muscular wall. It can cause heavy, painful periods and a feeling of fullness in the lower belly. It is often confused with other causes of painful periods and can only be assessed by a healthcare professional. Keeping a record of pain and flow helps that conversation.",
    reviewed: false,
  },
  {
    id: "ai-limits",
    title: "What the SikLo assistant can and cannot do",
    keywords: "ai assistant bot chat can you help what do you do limits",
    text:
      "The assistant explains how cycles work, describes common symptoms, and helps you read patterns in what you have logged. It is software, not a healthcare professional: it cannot examine you, order tests, diagnose a condition, recommend medicine or doses, or tell you which days are safe. For anything about your own body that worries you, see a qualified professional.",
    reviewed: false,
  },
  {
    id: "anaemia",
    title: "Low iron and anaemia",
    keywords: "anaemia anemia iron low blood pale dizzy breathless tired kulang sa dugo",
    text:
      "Losing a lot of blood each cycle can lower the body's iron, which may cause tiredness, pale skin, breathlessness, dizziness or a fast heartbeat. Iron-rich food helps, but confirming low iron needs a blood test. A healthcare professional can test for it and advise on treatment; do not start supplements on your own guess.",
    reviewed: false,
  },
  {
    id: "back-leg-pain",
    title: "Back and leg pain during periods",
    keywords: "back pain, lower back, likod, masakit likod, leg pain, thigh, hita, binti, body ache",
    text:
      "Period cramps can spread to the lower back and thighs, because the same nerves serve these areas. Heat on the lower back, gentle stretching, and rest may help. This kind of pain is common and usually eases as the period ends. See a healthcare professional if back or leg pain is severe, happens outside your period, or comes with fever.",
    reviewed: false,
  },
  {
    id: "bacterial-vaginosis",
    title: "Bacterial vaginosis",
    keywords: "bv bacterial vaginosis fishy smell grey discharge",
    text:
      "Bacterial vaginosis happens when the balance of bacteria in the vagina changes, often causing thin grey discharge and a strong smell that can be more noticeable after sex. It is common and treatable, and it is not caused by poor hygiene. A healthcare professional can confirm it and treat it.",
    reviewed: false,
  },
  {
    id: "basal-temperature",
    title: "Basal body temperature",
    keywords: "temperature bbt basal thermometer morning temp chart rise 0.2 degrees",
    text:
      "Body temperature at rest rises slightly after ovulation and stays higher until the next period. Measuring it at the same time each morning before getting up, over several cycles, can show that pattern. It confirms ovulation after it has happened rather than predicting it, and illness, poor sleep and alcohol can affect readings.",
    reviewed: false,
  },
  {
    id: "birth-control-periods",
    title: "Hormonal birth control and periods",
    keywords: "birth control, contraceptive, contraception, pill, pills, implant, injection, iud, hormonal, family planning, pills changed my period",
    text:
      "Hormonal birth control, such as the pill, implant, injection, or hormonal IUD, can change periods. They may become lighter, shorter, irregular, include spotting, or stop for a while. These changes are often expected, but a healthcare professional can tell you what is normal for your method. Do not stop or change a method without talking to a provider, and ask them about missed doses.",
    reviewed: false,
  },
  {
    id: "bleeding-in-pregnancy",
    title: "Bleeding during pregnancy",
    keywords: "bleeding pregnant pregnancy spotting miscarriage cramping early",
    text:
      "Light spotting can happen in early pregnancy and does not always mean something is wrong, but any bleeding during pregnancy should be assessed by a healthcare professional. Heavy bleeding, severe or one-sided pain, shoulder pain, or feeling faint needs urgent care. You deserve support through this, not guesswork from an app.",
    reviewed: false,
  },
  {
    id: "breast-tenderness",
    title: "Sore or tender breasts",
    keywords: "breast breasts sore tender painful swollen boobs chest masakit dibdib",
    text:
      "Breast tenderness before a period is common and usually comes from hormone changes, easing once bleeding starts. A supportive bra and heat or cold help some people. A new lump, skin changes, or discharge from the nipple should be checked by a healthcare professional, whatever the time of the cycle.",
    reviewed: false,
  },
  {
    id: "breastfeeding-periods",
    title: "Breastfeeding and periods",
    keywords: "breastfeeding nursing lactation no period delayed return milk",
    text:
      "Breastfeeding often delays the return of periods, and more frequent feeding tends to delay it longer. The return is unpredictable, and ovulation can happen before the first period, so pregnancy is possible. A healthcare professional can explain contraception that suits breastfeeding.",
    reviewed: false,
  },
  {
    id: "caffeine-alcohol",
    title: "Caffeine and alcohol",
    keywords: "caffeine coffee alcohol drink beer wine period symptoms",
    text:
      "Some people find caffeine worsens breast tenderness, anxiety or sleep problems before a period, and that alcohol disrupts sleep and worsens next-day tiredness. Others notice no difference. Logging what you drink alongside symptoms over a few cycles is the only way to see your own pattern.",
    reviewed: false,
  },
  {
    id: "cervical-mucus",
    title: "Cervical mucus changes",
    keywords: "mucus cervical discharge egg white stretchy clear wet dry texture",
    text:
      "Discharge often changes across the cycle. After a period it may be light or absent, then becomes creamy, then clearer, wetter and stretchy like raw egg white around ovulation, then thicker again afterwards. These changes are a normal sign of hormone shifts. Discharge that itches, smells strongly, or changes colour to green or grey should be checked.",
    reviewed: false,
  },
  {
    id: "clots",
    title: "Blood clots during a period",
    keywords: "clot clots lumps jelly thick dark namuong dugo",
    text:
      "Small clots during the heaviest days are common and happen when blood leaves faster than the body can thin it. Clots regularly larger than a coin, especially with very heavy bleeding, are worth mentioning to a healthcare professional, who can check for causes such as fibroids or hormone changes.",
    reviewed: false,
  },
  {
    id: "condoms-stis",
    title: "Condoms and infection risk",
    keywords: "condom condoms protection sti std infection safe sex barrier",
    text:
      "Condoms are the only common contraceptive that also lowers the risk of sexually transmitted infections. Using one correctly every time, and checking the expiry date and packaging, matters for both purposes. A clinic or healthcare professional can advise on testing and on combining methods.",
    reviewed: false,
  },
  {
    id: "contraception-types",
    title: "Kinds of contraception",
    keywords: "contraception birth control pill iud implant injection condom options prevent pregnancy",
    text:
      "There are several kinds of contraception, including pills, injections, implants, intrauterine devices, and barrier methods such as condoms. They differ in how they work, how effective they are, and how they affect bleeding. Only condoms also reduce the risk of sexually transmitted infections. Which one suits you depends on your health and your plans, so a healthcare professional or family planning clinic is the right place to decide.",
    reviewed: false,
  },
  {
    id: "cramps",
    title: "Period cramps",
    keywords: "cramp cramps cramping pain painful dysmenorrhea puson sakit masakit belly stomach lower abdomen hurts ache",
    text:
      "Cramps are a dull or throbbing pain in the lower belly, often starting just before or with the period and easing after one to three days. They happen because the uterus tightens to shed its lining. Heat, gentle movement, and rest help many people. Pain that stops you from school, work, or sleep is not something you have to accept, and a healthcare professional can look into it.",
    reviewed: false,
  },
  {
    id: "cycle-length",
    title: "How long a cycle usually lasts",
    keywords: "how long cycle length normal typical 28 days 21 35 average gaano katagal",
    text:
      "Cycle length is counted from the first day of one period to the day before the next. For most adults a cycle lasting anywhere from 21 to 35 days is considered typical, and periods often last two to seven days. There is no single correct number, and your own usual range matters more than the average. Cycles that are often outside that range are worth raising with a healthcare professional.",
    reviewed: false,
  },
  {
    id: "cycle-phases",
    title: "The phases of a cycle",
    keywords: "phase phases follicular luteal menstrual ovulatory stages what happens hormones estrogen progesterone",
    text:
      "A cycle is usually described in phases. The period itself comes first. The follicular phase follows, when estrogen rises and an egg matures. Ovulation is when the egg is released. The luteal phase follows, when progesterone rises and then falls if no pregnancy begins, which brings the next period. Phase lengths differ between people and between cycles.",
    reviewed: false,
  },
  {
    id: "diet-nutrition",
    title: "Eating across the cycle",
    keywords: "diet food eat nutrition cravings sugar meals healthy kain",
    text:
      "There is no special diet that fixes periods. Eating regularly, with enough protein, iron-rich foods, fruit and vegetables, supports energy through the cycle. Cravings before a period are common and not a failure. If eating feels difficult to control, or you are restricting food, a healthcare professional is the right person to talk to.",
    reviewed: false,
  },
  {
    id: "digestion-bloating",
    title: "Bloating and stomach changes",
    keywords: "bloating, bloated, gas, diarrhea, loose stool, constipation, stomach upset, nausea, kabag, tae, poop, bowel",
    text:
      "Bloating and stomach changes are common around a period. Chemicals called prostaglandins, which also cause cramps, can loosen stools or cause nausea. Drinking water, eating regular meals, cutting back on very salty food, and gentle movement may help. See a healthcare professional if stomach pain is severe, you see blood in your stool, or symptoms do not ease after your period.",
    reviewed: false,
  },
  {
    id: "discharge",
    title: "Vaginal discharge",
    keywords: "discharge, white, clear, sticky, stretchy, wet, smell, odor, itchy, itch, puti, mabaho, makati, yellow, green",
    text:
      "Vaginal discharge is normal and helps keep the vagina clean. It is usually clear or white and changes across the cycle, becoming wetter and stretchy like egg white around ovulation. See a healthcare professional if discharge has a strong or fishy smell, turns yellow, green, or gray, looks like cottage cheese, or comes with itching, burning, or pelvic pain.",
    reviewed: false,
  },
  {
    id: "dizziness",
    title: "Dizziness and feeling faint",
    keywords: "dizzy dizziness faint fainting lightheaded black out hilo",
    text:
      "Feeling briefly lightheaded when standing during a period is not unusual, especially with pain or heavy bleeding. Sit or lie down, and drink fluids. Fainting, repeated dizziness, or dizziness with very heavy bleeding needs medical attention the same day, as it can point to low iron or blood loss that needs treating.",
    reviewed: false,
  },
  {
    id: "doctor-visit-prep",
    title: "Preparing for a check-up",
    keywords: "doctor visit appointment prepare what to bring ask questions consult",
    text:
      "It helps to bring the dates of your recent periods, how long they lasted and how heavy they were, the symptoms that concern you, any medicines or contraception you use, and your questions written down. Your SikLo log can be shown or read out. It is also fine to ask the professional to explain anything again, or to ask what the next step would be.",
    reviewed: false,
  },
  {
    id: "emergency-contraception",
    title: "Emergency contraception",
    keywords: "emergency contraception morning after pill plan b unprotected sex condom broke",
    text:
      "Emergency contraception can reduce the chance of pregnancy after unprotected sex, and it works better the sooner it is used. The options, timing and suitability differ from person to person, so a pharmacist, clinic or healthcare professional should advise you rather than a tracking app. SikLo cannot tell you what to take or how much.",
    reviewed: false,
  },
  {
    id: "endometriosis",
    title: "About endometriosis",
    keywords: "endometriosis, endo, very painful, severe cramps, pain getting worse, pelvic pain, painful sex, painful bowel",
    text:
      "Endometriosis is a condition where tissue similar to the lining of the uterus grows outside the uterus. It can cause period pain that is severe or gets worse over time, pain during sex or bowel movements, and sometimes heavy bleeding. Diagnosis often takes time, so writing down your symptoms helps. Period pain that stops you from going to school or work is a good reason to see a healthcare professional.",
    reviewed: false,
  },
  {
    id: "exercise",
    title: "Exercise and your period",
    keywords: "exercise, workout, gym, sports, run, running, swim, swimming, yoga, walk, ehersisyo, laro, pe class",
    text:
      "Exercise during your period is safe for most people and can help with cramps, bloating, and mood. Gentle options like walking, stretching, or yoga may feel best on heavier or more painful days. Listen to your body and rest when you need to. See a healthcare professional if pain stops you from doing your usual activities.",
    reviewed: false,
  },
  {
    id: "fatigue",
    title: "Feeling tired around your period",
    keywords: "tired tiredness fatigue exhausted no energy sleepy weak pagod antok",
    text:
      "Tiredness around a period is common and can come from hormone changes, poor sleep, pain, or low iron from heavy bleeding. Regular meals, iron-rich food, and gentle movement help some people. Tiredness that is constant, or comes with breathlessness, dizziness or a fast heartbeat, should be checked by a healthcare professional.",
    reviewed: false,
  },
  {
    id: "fertile-window",
    title: "The fertile window",
    keywords: "fertile window conceive chances pregnant most likely days fertility when",
    text:
      "Sperm can survive several days inside the body and an egg lives about a day after it is released, so pregnancy is most likely in the few days before and on the day of ovulation. This window is estimated, not measured, and it shifts from cycle to cycle. Because of that, tracking is not a reliable way to avoid pregnancy. A healthcare professional can explain contraception if that is your goal.",
    reviewed: false,
  },
  {
    id: "fibroids",
    title: "Fibroids",
    keywords: "fibroid fibroids myoma growth uterus heavy pressure",
    text:
      "Fibroids are non-cancerous growths in or on the wall of the uterus. They are common, and many cause no symptoms at all. When they do, it is often heavy or long periods, pressure in the lower belly, or needing to pass urine more often. A healthcare professional can assess them, usually with an examination and an ultrasound, and explain the options.",
    reviewed: false,
  },
  {
    id: "first-period",
    title: "Your first period",
    keywords: "first period, first time, menarche, start, began, teen, young, kid, unang regla, first mens, nagka-regla",
    text:
      "Most people get their first period between about ages 10 and 15, often around two years after breasts start to develop. The first periods may be light, irregular, and spaced far apart, which is normal for the first few years. It helps to keep a pad in your bag and to talk with a trusted adult. See a healthcare professional if periods haven't started by age 15, or if bleeding is very heavy or painful.",
    reviewed: false,
  },
  {
    id: "headaches",
    title: "Headaches around your period",
    keywords: "headache, headaches, migraine, head pain, sakit ng ulo, masakit ulo, period headache",
    text:
      "Some people get headaches or migraines just before or during their period, often linked to the drop in estrogen. Rest, drinking water, regular meals, and a dark quiet room can help. Keeping track of when headaches happen can show whether they follow your cycle. Get urgent care for a sudden, very severe headache, or one with vision changes, weakness, confusion, or fever.",
    reviewed: false,
  },
  {
    id: "heavy-bleeding",
    title: "Heavy bleeding",
    keywords: "heavy bleeding flow soaking pad tampon hour clots large too much sobrang dugo malakas",
    text:
      "Bleeding is considered heavy if you soak through a pad or tampon every hour for several hours, need to change overnight, pass clots larger than a coin, or bleed for more than seven days. Heavy periods can cause tiredness and low iron. This is common and treatable, so it is worth seeing a healthcare professional rather than managing alone. Seek urgent care if you feel faint or very weak.",
    reviewed: false,
  },
  {
    id: "how-predictions-work",
    title: "How SikLo estimates your next period",
    keywords: "how does siklo predict estimate work accurate calculation algorithm",
    text:
      "SikLo looks at the gaps between your recorded period start dates, takes the middle value of your recent cycles, and counts that forward from your last period. It shows a range from your shortest to your longest recent cycle rather than one date. It waits until you have three complete cycles before estimating anything, so it never guesses from too little information.",
    reviewed: false,
  },
  {
    id: "hygiene",
    title: "Hygiene during a period",
    keywords: "hygiene wash clean douche soap smell shower bath vagina",
    text:
      "Washing the outside with water, and mild unscented soap if you like, is enough. The vagina cleans itself, and douching or scented products can upset its natural balance and raise the risk of irritation and infection. Changing products regularly matters more than extra washing. A strong unusual smell with itching or discharge should be checked.",
    reviewed: false,
  },
  {
    id: "implant-injection",
    title: "Bleeding with implants and injections",
    keywords: "implant injection depo contraceptive bleeding stopped irregular spotting arm",
    text:
      "Contraceptive implants and injections often change bleeding patterns. Some people have no periods at all, others have irregular spotting that can last for months. Both are expected effects rather than signs of harm, but they are worth discussing with a healthcare professional if they bother you, since other options exist.",
    reviewed: false,
  },
  {
    id: "iron-food",
    title: "Food, iron, and your period",
    keywords: "food, eat, diet, iron, anemia, tired, fatigue, dizzy, pagkain, kain, vegetables, malunggay, gulay, energy",
    text:
      "Losing blood each month can lower iron, especially with heavy periods, which can leave you tired or dizzy. Iron-rich foods include meat, fish, eggs, beans, and leafy greens like malunggay and kangkong, and eating them with vitamin C foods such as fruit helps your body absorb iron. Drinking enough water and eating regular meals can also help with energy. See a healthcare professional if you often feel very tired, weak, or dizzy.",
    reviewed: false,
  },
  {
    id: "irregular-periods",
    title: "Irregular periods",
    keywords: "irregular unpredictable varies changing different every month hindi regular pabago bago late early",
    text:
      "Periods are called irregular when the gap between them keeps changing, or when they come less than 21 or more than 35 days apart. Stress, illness, travel, weight change, exercise, contraception, thyroid conditions and PCOS can all affect timing. Irregular cycles are common and are not a diagnosis on their own. Keeping a log and bringing it to a check-up gives a healthcare professional something concrete to work from.",
    reviewed: false,
  },
  {
    id: "iud-bleeding",
    title: "Bleeding with an IUD",
    keywords: "iud coil copper hormonal bleeding spotting irregular inserted",
    text:
      "Both copper and hormonal intrauterine devices can change bleeding. Copper devices often make periods heavier or longer, especially at first. Hormonal ones often make them lighter and can stop them altogether. Irregular spotting in the first months is common with both. Severe pain, fever, or a device you think has moved needs prompt medical attention.",
    reviewed: false,
  },
  {
    id: "libido",
    title: "Changes in desire across the cycle",
    keywords: "libido sex drive desire horny interest low high",
    text:
      "Many people notice desire shifts across the cycle, often rising around ovulation and dropping before a period, though patterns differ and other things like stress, sleep, medicines and relationships matter at least as much. There is no correct level. A sudden lasting change you are unhappy with can be discussed with a healthcare professional.",
    reviewed: false,
  },
  {
    id: "medication-effects",
    title: "Medicines that affect periods",
    keywords: "medicine medication drugs affect period blood thinner antidepressant steroid",
    text:
      "Some medicines, including certain hormonal treatments, blood thinners, steroids and some mental-health medicines, can change bleeding or cycle timing. If your periods changed soon after starting something new, mention it to the prescriber or a pharmacist. Do not stop a prescribed medicine on your own.",
    reviewed: false,
  },
  {
    id: "menopause",
    title: "Menopause",
    keywords: "menopause menopausal periods stopped 12 months hot flushes 50 end",
    text:
      "Menopause is the point when periods have stopped for twelve months in a row. The years before it, when cycles become irregular and symptoms such as hot flushes or sleep changes appear, are called the transition. Any bleeding after twelve months without a period should be checked by a healthcare professional, even if it is light.",
    reviewed: false,
  },
  {
    id: "menstrual-cup",
    title: "Using a menstrual cup",
    keywords: "menstrual cup, cup, silicone cup, reusable, insert cup, clean cup, boil, sterilize",
    text:
      "A menstrual cup collects blood instead of absorbing it and can be reused for years with care. Wash your hands before and after, empty and rinse it at least as often as the instructions say, and clean it between periods as the maker recommends, often by boiling. It can take a few cycles to get comfortable inserting and removing it. Remove it and seek care if you develop a high fever, rash, or feel very unwell.",
    reviewed: false,
  },
  {
    id: "missed-period",
    title: "A missed or late period",
    keywords: "missed period late no period skipped didnt come hindi dumating delayed wala pa",
    text:
      "A late or missed period can follow stress, illness, travel, poor sleep, weight or exercise changes, contraception, breastfeeding, or approaching menopause. Pregnancy is also possible if you have had sex that could lead to it. A pregnancy test taken from the first day of a missed period gives a clearer answer than tracking can. If periods stop for three months or more, see a healthcare professional.",
    reviewed: false,
  },
  {
    id: "missed-period-test",
    title: "Missed period and pregnancy tests",
    keywords: "missed, late, no period, pregnancy test, test, pt, positive, negative, delayed, buntis, delay, hindi pa dinadatnan",
    text:
      "A period can be late for many reasons, including stress, illness, travel, or changes in weight or exercise. If there is any chance of pregnancy, a home pregnancy test is most accurate from the first day of the missed period. If the test is negative but your period still has not come, you can test again a few days later. A healthcare professional can help if your period is very late or you are unsure what to do.",
    reviewed: false,
  },
  {
    id: "mood-changes",
    title: "Mood changes across the cycle",
    keywords: "mood moody emotional irritable angry sad anxious crying low feelings hormones iyakin",
    text:
      "Hormone shifts across the cycle can affect mood, and many people feel lower or more irritable before a period. Logging mood alongside dates can show you a pattern over a few cycles. If low mood lasts most of the month, or you feel hopeless, that goes beyond the cycle and deserves support from a healthcare professional.",
    reviewed: false,
  },
  {
    id: "nausea",
    title: "Nausea during a period",
    keywords: "nausea nauseous vomit vomiting sick stomach upset throwing up nasusuka",
    text:
      "Some people feel queasy during the first days of a period, often alongside cramps. Small plain meals, fluids and rest help many. Vomiting that stops you keeping fluids down, or nausea with severe pain or fever, needs medical attention.",
    reviewed: false,
  },
  {
    id: "no-products",
    title: "When you have no products available",
    keywords: "no pad no tampon cannot afford emergency ran out wala akong pad",
    text:
      "If you have run out, clean folded cloth or tissue in your underwear works short term and should be changed often. Many schools, clinics and barangay health centres keep supplies and will give them without fuss. Not being able to afford products is common and nothing to be ashamed of; asking a school nurse or health worker is a reasonable thing to do.",
    reviewed: false,
  },
  {
    id: "ovarian-cyst",
    title: "Ovarian cysts",
    keywords: "cyst cysts ovary ovarian fluid sac ultrasound bloating",
    text:
      "Small fluid-filled sacs form on the ovaries as part of many ordinary cycles and usually disappear on their own without symptoms. Some cause bloating, pressure or pain. Having cysts is not the same as having PCOS. Only a healthcare professional can assess a cyst, usually with an examination and sometimes an ultrasound. Sudden severe pain with vomiting or faintness needs urgent care.",
    reviewed: false,
  },
  {
    id: "ovulation",
    title: "Ovulation",
    keywords: "ovulation, ovulate, ovulating, egg, fertile, mid cycle pain, mittelschmerz, one side pain, temperature",
    text:
      "Ovulation is when an ovary releases an egg, usually about 10 to 16 days before the next period. Some people notice clearer, stretchy discharge, mild one-sided lower belly pain, or a small rise in body temperature after ovulation. The timing can shift from cycle to cycle, so estimates from tracking are not reliable as birth control. A healthcare professional can explain options if you want to avoid or plan a pregnancy.",
    reviewed: false,
  },
  {
    id: "ovulation-tests",
    title: "Ovulation tests",
    keywords: "ovulation test lh strip kit predictor positive line opk",
    text:
      "Ovulation predictor tests look for a rise in luteinising hormone in urine, which usually happens a day or two before an egg is released. A positive result suggests ovulation is near. Results can be harder to read for people with irregular cycles or PCOS. Follow the instructions in the pack, and ask a pharmacist or healthcare professional if results are confusing.",
    reviewed: false,
  },
  {
    id: "pads-tampons",
    title: "Pads, tampons and cups",
    keywords: "pad pads tampon tampons cup disc product choose which napkin",
    text:
      "Pads sit outside the body, tampons and cups sit inside. All are safe when used as directed. Tampons and cups need changing or emptying within the time stated on the packet. Which one suits you depends on comfort, flow and what is available to you. There is no health reason to prefer one, and using tampons does not affect virginity.",
    reviewed: false,
  },
  {
    id: "pain-relief",
    title: "Easing period pain at home",
    keywords: "relief, relieve, remedy, remedies, help pain, what helps, hot compress, heat, painkiller, pain reliever, gamot, pampawala, lunas",
    text:
      "Warmth on the lower belly or back, gentle movement, rest, and staying hydrated can ease period pain. Some people use over-the-counter pain relievers; ask a pharmacist or doctor which one is right for you and always follow the label. Starting comfort measures early, when pain begins, often works best. See a healthcare professional if pain is severe, getting worse, or not helped by these steps.",
    reviewed: false,
  },
  {
    id: "pcos",
    title: "About PCOS",
    keywords: "pcos, polycystic, ovary, ovaries, syndrome, cyst, cysts, hormonal, excess hair, hirsutism, no period",
    text:
      "PCOS (polycystic ovary syndrome) is a common hormonal condition. Signs can include irregular or missing periods, extra hair on the face or body, acne, and trouble managing weight. Only a healthcare professional can diagnose PCOS, usually with a history, exam, and sometimes blood tests or an ultrasound. If your periods are often irregular, bringing your period log to a check-up can help.",
    reviewed: false,
  },
  {
    id: "pelvic-pain",
    title: "Pelvic pain outside your period",
    keywords: "pelvic pain lower abdomen hurts between periods ovary side sharp sakit",
    text:
      "Mild one-sided twinges around the middle of a cycle are common and often related to ovulation. Pain that is severe, lasts for days, comes with fever, vomiting, or heavy bleeding, or happens during sex, should be assessed by a healthcare professional. Sudden severe pelvic pain needs urgent care.",
    reviewed: false,
  },
  {
    id: "perimenopause",
    title: "Periods in your 40s and menopause",
    keywords: "menopause, perimenopause, 40s, forties, hot flash, hot flashes, older, mother menopause, stopped period age",
    text:
      "In the years before menopause, usually in the 40s, periods can become irregular, heavier, or lighter, and hot flashes or sleep changes may start. Menopause is confirmed after 12 months in a row with no period. Any bleeding after menopause should be checked by a healthcare professional. A provider can also help if symptoms affect daily life.",
    reviewed: false,
  },
  {
    id: "period-colour",
    title: "The colour of period blood",
    keywords: "colour color brown black dark bright red pink orange start end kulay",
    text:
      "Period blood often changes colour across the days. Brown or dark blood is usually older blood leaving more slowly, which is common at the beginning or end. Bright red is usually fresher, faster flow. Colour alone rarely means something is wrong. Grey discharge, or bleeding with a strong unusual smell, itching or fever, should be checked by a healthcare professional.",
    reviewed: false,
  },
  {
    id: "period-myths-ph",
    title: "Common period myths",
    keywords: "myth, myths, pamahiin, bawal, maligo, bathe, bath, shower, ligo, wash hair, maasim, sour, exercise, swim, totoo ba",
    text:
      "Bathing and washing your hair during your period are safe and help you stay clean and comfortable. Warm showers may even ease cramps. Eating sour food does not stop or worsen a period, and light exercise or swimming is fine and can help with cramps. If a belief makes you uncomfortable or worried, it's okay to ask a healthcare professional what is safe for you.",
    reviewed: false,
  },
  {
    id: "period-poverty",
    title: "Why periods are a health matter, not a private inconvenience",
    keywords: "why important track health sign vital why bother purpose",
    text:
      "The cycle responds to many parts of general health, including hormones, nutrition, stress, thyroid function and body weight. A clear record of your own pattern makes changes easier to notice early and gives a healthcare professional real information instead of guesses. That is why many clinicians treat the cycle as a sign of overall health.",
    reviewed: false,
  },
  {
    id: "period-underwear",
    title: "Period underwear",
    keywords: "period underwear panties absorbent reusable washable",
    text:
      "Period underwear absorbs blood in built-in layers and is washed and reused. Capacity varies by product, so on heavier days some people pair it with another product. Follow the washing instructions, since fabric softener can reduce absorbency.",
    reviewed: false,
  },
  {
    id: "pmdd",
    title: "Severe mood changes before periods (PMDD)",
    keywords: "pmdd, severe mood, depressed, depression, hopeless, panic, rage, before period, premenstrual dysphoric, sobrang lungkot",
    text:
      "Some people have very strong mood symptoms in the week or two before their period, such as deep sadness, anxiety, irritability, or feeling out of control, that ease once the period starts. When this seriously affects daily life, it may be PMDD, which is treatable. Tracking your mood alongside your cycle helps a healthcare professional understand the pattern. If you ever have thoughts of hurting yourself, please reach out for help right away.",
    reviewed: false,
  },
  {
    id: "pms",
    title: "Premenstrual symptoms (PMS)",
    keywords: "pms premenstrual before period symptoms mood irritable bloating tender sad week before",
    text:
      "Many people notice changes in the week or two before a period: mood shifts, irritability, tiredness, bloating, breast tenderness, headaches or food cravings. These usually ease once the period starts. Sleep, movement, and eating regularly help some people. When these symptoms regularly disrupt your relationships, work or school, that is worth discussing with a healthcare professional.",
    reviewed: false,
  },
  {
    id: "postpartum-periods",
    title: "Periods after giving birth",
    keywords: "postpartum after birth baby delivery lochia first period return",
    text:
      "Bleeding in the weeks after giving birth is not a period; it is the body recovering. Periods return at different times for different people, from a few weeks to many months, and the first ones are often irregular or different from before. Pregnancy is possible before the first period returns. Heavy bleeding, fever or a bad smell after birth needs urgent care.",
    reviewed: false,
  },
  {
    id: "prediction-limits",
    title: "What tracking cannot tell you",
    keywords: "accurate wrong prediction limits reliable trust safe days can it tell",
    text:
      "Tracking describes what has happened and projects it forward. It cannot confirm ovulation, detect pregnancy, diagnose a condition, or identify days when sex cannot lead to pregnancy. Cycles shift with stress, illness, travel and hormones, so estimates move. Treat the dates as a guide for planning, and a healthcare professional as the source for anything medical.",
    reviewed: false,
  },
  {
    id: "pregnancy-signs",
    title: "Early signs of pregnancy",
    keywords: "pregnancy signs symptoms early nausea tender tired missed test buntis",
    text:
      "Early pregnancy signs can include a missed period, tender breasts, tiredness, nausea and needing to pass urine more often. These overlap almost entirely with ordinary premenstrual symptoms, so they cannot confirm anything. A pregnancy test, most reliable from the first day of a missed period, or a visit to a healthcare professional, gives a real answer. SikLo cannot tell you whether you are pregnant.",
    reviewed: false,
  },
  {
    id: "privacy",
    title: "Where your information is kept",
    keywords: "privacy private data stored safe who sees secure delete account",
    text:
      "SikLo keeps your profile and logs on the device you are using. There is no account, no email and no password, and the app works without a connection. You can delete everything from the Profile screen, which removes your setup answers, dates and logs from this device. If you share a device with others, remember they can open the app too.",
    reviewed: false,
  },
  {
    id: "school-work",
    title: "Managing a period at school or work",
    keywords: "school work class office period leak supplies emergency bag",
    text:
      "Keeping a small supply of products, a spare pair of underwear and pain relief in your bag reduces the stress of an unexpected period. Knowing where the nearest toilet and clinic are helps too. If pain regularly keeps you from attending school or work, that is a medical issue worth raising, not something to push through alone.",
    reviewed: false,
  },
  {
    id: "sex-during-period",
    title: "Sex during a period",
    keywords: "sex during period intercourse safe pregnant while bleeding",
    text:
      "Having sex during a period is safe for most people, and comfort is the main thing that decides it. Pregnancy is still possible, because sperm can survive several days and ovulation timing varies, so it is not a safe period. Infection risk is unchanged, so condoms still matter.",
    reviewed: false,
  },
  {
    id: "sleep",
    title: "Sleep and your cycle",
    keywords: "sleep, insomnia, cant sleep, tired, sleepy, night, puyat, antok, hindi makatulog, night sweats",
    text:
      "Hormone changes before a period can make it harder to sleep for some people, and cramps or night sweats can wake you up. A regular bedtime, a cool dark room, less caffeine later in the day, and warmth on your belly for cramps may help. Feeling a little more tired around your period is common. If poor sleep or exhaustion lasts for weeks, talk to a healthcare professional.",
    reviewed: false,
  },
  {
    id: "spotting",
    title: "Spotting between periods",
    keywords: "spotting, spot, light bleeding, between periods, brown discharge, mid cycle, patak, patak-patak",
    text:
      "Spotting is light bleeding outside your usual period, often pink or brown. It can happen around ovulation, when starting or changing hormonal birth control, or during times of stress. It is usually lighter than a period and may not need a pad. See a healthcare professional if spotting happens often, comes with pain, happens after sex, or happens after menopause.",
    reviewed: false,
  },
  {
    id: "sti-basics",
    title: "Sexually transmitted infections",
    keywords: "sti std infection chlamydia gonorrhea discharge smell burning testing screening",
    text:
      "Many sexually transmitted infections cause no symptoms at all, which is why testing matters more than waiting for signs. When symptoms do appear they can include unusual discharge, burning when passing urine, pain during sex, or bleeding between periods. Testing is straightforward and often free at public clinics. A healthcare professional can arrange it and treat what is found.",
    reviewed: false,
  },
  {
    id: "stress",
    title: "Stress and your period",
    keywords: "stress, stressed, exam, exams, anxiety, worried, pressure, school, work, late because of stress, puyat, problema",
    text:
      "Stress can affect the hormones that control the cycle, which can delay ovulation and make a period late or irregular. Big events like exams, moving, or illness are common triggers. Rest, regular meals, movement, and talking to someone you trust can help. If periods stay irregular after the stressful time passes, a healthcare professional can check for other causes.",
    reviewed: false,
  },
  {
    id: "stress-cycle",
    title: "How stress affects cycles",
    keywords: "stress stressed exams pressure anxiety late period delayed cortisol",
    text:
      "Periods of high stress can delay ovulation, which pushes the next period later or occasionally skips it. This is the body responding to circumstances rather than something breaking. Sleep, rest and support help. Cycles that stay disrupted for several months deserve a check-up, because stress is not always the explanation.",
    reviewed: false,
  },
  {
    id: "swimming-sports",
    title: "Swimming and sport during a period",
    keywords: "swim swimming sports exercise gym run period can i",
    text:
      "You can swim and play sport during a period. A tampon or cup makes swimming easier; pads are not suitable in water. Exercise does not harm you during a period and often eases cramps, though lower energy on heavier days is normal. Adjust the intensity rather than stopping entirely if that suits you.",
    reviewed: false,
  },
  {
    id: "talking-to-adults",
    title: "Talking about periods",
    keywords: "talk, tell, parents, mom, mother, nanay, mama, school nurse, embarrassed, shy, nahihiya, ask for help, clinic",
    text:
      "Periods are a normal part of health, and it is okay to talk about them. A parent, older sibling, school nurse, or other trusted adult can help with supplies and questions. If talking feels awkward, you can start with a short message or show them what you are tracking. Healthcare workers hear these questions every day and are there to help.",
    reviewed: false,
  },
  {
    id: "talking-to-partner",
    title: "Talking to a partner about your cycle",
    keywords: "partner boyfriend husband talk explain tell understand support",
    text:
      "You decide how much to share. Some people find it helps to explain when they usually feel low energy or pain, and what support actually helps on those days. A partner does not need access to your log for that. If someone pressures you to share health details or to track for them, that is worth talking through with someone you trust.",
    reviewed: false,
  },
  {
    id: "teen-cycles",
    title: "The first few years of periods",
    keywords: "teen teenager young first years irregular puberty 14 15 16 school",
    text:
      "In the first two or three years after periods begin, cycles are often irregular, and gaps of a few weeks to a couple of months can be ordinary while hormones settle. Tracking during this time is useful mainly for noticing your own pattern. Periods that have not started by age 15, or very heavy or very painful periods at any age, are worth a check-up.",
    reviewed: false,
  },
  {
    id: "thyroid-periods",
    title: "Thyroid changes and periods",
    keywords: "thyroid hypothyroid hyperthyroid hormone neck tired weight periods stopped",
    text:
      "The thyroid helps regulate many body processes, and when it is overactive or underactive it can change how often periods come and how heavy they are. Other signs can include tiredness, weight change, feeling unusually hot or cold, or hair changes. A simple blood test ordered by a healthcare professional can check it.",
    reviewed: false,
  },
  {
    id: "tracking-tips",
    title: "Tips for tracking your cycle",
    keywords: "track, tracking, log, logging, calendar, record, app, how to track, start date, note symptoms, ilista",
    text:
      "Log the first day of each period, how heavy the flow is, and any symptoms or mood changes. After about three cycles, patterns become easier to see, such as when cramps or low mood usually happen. Predictions improve as you add more history, but they are always estimates. Your log is also useful to show a healthcare professional at a check-up.",
    reviewed: false,
  },
  {
    id: "travel",
    title: "Travel and your cycle",
    keywords: "travel flight time zone jet lag holiday period changed abroad",
    text:
      "Travel, time-zone changes and disrupted sleep can shift a period by days, so an estimate may be off after a trip. Packing more products than you expect to need is sensible, since brands and availability differ between places. Log the actual start date when it comes so your pattern stays accurate.",
    reviewed: false,
  },
  {
    id: "trying-to-conceive",
    title: "Trying to get pregnant",
    keywords: "conceive pregnant trying ttc baby fertility plan getting pregnant mabuntis",
    text:
      "Most couples who have regular unprotected sex conceive within a year. Knowing your own cycle pattern and the signs around ovulation can help with timing. Many things affect fertility for both partners. If you are under 35 and have been trying for a year, or over 35 and trying for six months, a healthcare professional can start looking into it with you.",
    reviewed: false,
  },
  {
    id: "tss",
    title: "Toxic shock syndrome warning signs",
    keywords: "toxic shock, tss, tampon fever, high fever, rash, sunburn rash, vomiting, tampon left, forgot tampon",
    text:
      "Toxic shock syndrome is rare but serious and has been linked to tampons and other internal period products. Warning signs include a sudden high fever, vomiting or diarrhea, a sunburn-like rash, dizziness or fainting, and confusion. If these happen while using a tampon or cup, remove it and get emergency medical care right away. Using the lowest absorbency you need and changing products on time lowers the risk.",
    reviewed: false,
  },
  {
    id: "urgent-signs",
    title: "Signs that need care straight away",
    keywords: "emergency urgent now hospital severe worst help immediately",
    text:
      "Get medical help straight away if you soak a pad or tampon every hour for several hours, feel faint or pass out, have severe or sudden pelvic pain, have a fever with pelvic pain or unusual discharge, have bleeding during pregnancy, or feel very weak or breathless. These need to be seen, not tracked.",
    reviewed: false,
  },
  {
    id: "uti",
    title: "Urinary infections",
    keywords: "uti urine burning pee frequent bladder infection cystitis ihi",
    text:
      "A urinary tract infection often causes burning when passing urine, needing to go often and urgently, and cloudy or strong-smelling urine. It is separate from your period, though it can happen at the same time. Drinking water helps symptoms but does not treat the infection. Pain in the back or side, fever or shivering needs prompt medical care.",
    reviewed: false,
  },
  {
    id: "weight-cycles",
    title: "Body weight and cycles",
    keywords: "weight gain loss bmi heavy thin exercise periods stopped amenorrhea",
    text:
      "Large or rapid changes in body weight, in either direction, can change how often periods come or stop them for a while, because body fat affects hormone levels. Very intense training with limited eating can also stop periods. If your periods have stopped and you are not pregnant, a healthcare professional should look into it rather than waiting it out.",
    reviewed: false,
  },
  {
    id: "what-to-log",
    title: "What is worth logging",
    keywords: "what should i log track record symptoms useful helpful",
    text:
      "The most useful things are the first and last day of each period and how heavy it was. Beyond that, log whatever you want to understand: pain, mood, sleep, discharge, or anything unusual. A few cycles of consistent dates are more useful to a healthcare professional than months of detailed notes with gaps.",
    reviewed: false,
  },
  {
    id: "when-to-see-doctor",
    title: "When to see a healthcare professional",
    keywords: "doctor, see a doctor, when, check up, clinic, ob, obgyn, gynecologist, worried, normal ba, should i worry, magpatingin",
    text:
      "It is a good idea to see a healthcare professional if your periods have not started by age 15, stop for three months or more, or usually come less than 21 or more than 35 days apart. Also go if bleeding lasts more than 7 days, you soak a pad or tampon every hour, pain stops daily activities, or you bleed between periods, after sex, or after menopause. Get urgent care if you feel faint or very weak.",
    reviewed: false,
  },
  {
    id: "why-periods",
    title: "Why periods happen",
    keywords: "menstruation menstruate menstrual period periods why happen cause reason bleed bleeding monthly uterus lining regla mens dalaw meron",
    text:
      "Each cycle, hormones thicken the lining of the uterus in case a pregnancy begins. If no pregnancy happens, hormone levels fall and the uterus sheds that lining. It leaves the body through the vagina as menstrual blood, which is the period. After a few days the lining starts building again and the next cycle begins.",
    reviewed: false,
  },
  {
    id: "yeast-infection",
    title: "Thrush and yeast infections",
    keywords: "yeast thrush itchy itching cottage cheese discharge candida",
    text:
      "Thrush is a common fungal overgrowth that can cause itching, soreness and thick white discharge. It is not a sexually transmitted infection, though it can follow antibiotics, hormone changes or irritation. A pharmacist or healthcare professional can confirm it and advise on treatment. Repeated episodes are worth investigating.",
    reviewed: false,
  },
];

/**
 * Words that make a question on-topic for SikLo. A question with none of
 * these is declined rather than matched to the nearest article.
 */
export const TOPIC_TERMS: ReadonlySet<string> = new Set(["abdomen", "abroad", "absorbent", "account", "accurate", "acne", "across", "adenomyosis", "affect", "affects", "afford", "after", "akong", "alcohol", "algorithm", "amenorrhea", "anaemia", "anemia", "antidepressant", "antok", "anxiety", "anxious", "appointment", "arm", "around", "ask", "assistant", "available", "average", "away", "baby", "bacterial", "bago", "barrier", "basal", "bath", "bathe", "bawal", "bbt", "because", "beer", "before", "began", "belly", "between", "binti", "birth", "bladder", "bleed", "bleeding", "bloated", "bloating", "blood", "bmi", "boil", "boobs", "bot", "bother", "bowel", "boyfriend", "breakout", "breakouts", "breast", "breastfeeding", "breasts", "breathless", "bring", "broke", "buntis", "caffeine", "calculation", "calendar", "candida", "cannot", "cant", "care", "cause", "cervical", "cervix", "chances", "changed", "changing", "chart", "chat", "cheese", "chest", "chin", "chlamydia", "choose", "clean", "clot", "clots", "coffee", "coil", "come", "compress", "conceive", "conception", "condom", "condoms", "constipation", "consult", "contraception", "contraceptive", "control", "copper", "cortisol", "cottage", "cramp", "cramping", "cramps", "cravings", "crying", "cup", "cups", "cycle", "cycles", "cyst", "cystitis", "cysts", "dalaw", "date", "degrees", "delay", "delete", "delivery", "depo", "depressed", "depression", "desire", "diarrhea", "dibdib", "didnt", "different", "dinadatnan", "disc", "discharge", "dizziness", "douche", "drive", "drugs", "dry", "dugo", "dumating", "during", "dysmenorrhea", "dysphoric", "easing", "eating", "egg", "ehersisyo", "embarrassed", "emergency", "emotional", "end", "endo", "endometrial", "endometriosis", "endometrium", "enlarged", "estimate", "estimates", "estrogen", "every", "exam", "exams", "excess", "exhausted", "explain", "faint", "fainting", "fallopian", "family", "fatigue", "fertile", "fertility", "fever", "few", "fibroid", "fibroids", "fishy", "flash", "flashes", "flight", "flow", "fluid", "flushes", "follicular", "forgot", "forties", "frequent", "gaano", "gain", "gamot", "gas", "getting", "giving", "gonorrhea", "growth", "gulay", "gynecologist", "happen", "happens", "head", "headache", "headaches", "health", "healthcare", "healthy", "helpful", "hilo", "hirsutism", "hita", "holiday", "hopeless", "hormonal", "hormone", "hormones", "horny", "hospital", "hour", "husband", "hygiene", "hyperthyroid", "hypothyroid", "ihi", "ilista", "immediately", "implant", "implants", "important", "inconvenience", "infection", "infections", "information", "injection", "injections", "insert", "inserted", "insomnia", "intercourse", "interest", "iron", "irregular", "irritable", "itch", "iud", "iyakin", "jelly", "jet", "kabag", "kain", "katagal", "kept", "kid", "kinds", "kit", "kulang", "kulay", "lactation", "lag", "laro", "leak", "left", "leg", "length", "libido", "lightheaded", "ligo", "likely", "likod", "limits", "line", "lining", "lochia", "log", "logged", "logging", "loose", "loss", "lumps", "lunas", "lungkot", "luteal", "maasim", "mabaho", "mabuntis", "magpatingin", "makati", "makatulog", "malakas", "maligo", "malunggay", "mama", "managing", "matter", "meals", "medication", "medicine", "medicines", "menarche", "menopausal", "menopause", "mens", "menses", "menstrual", "menstrualcup", "menstruate", "menstruation", "meron", "mid", "migraine", "milk", "miscarriage", "missed", "mittelschmerz", "mom", "monthly", "moody", "most", "mother", "mucus", "muscle", "myoma", "myth", "myths", "nagka", "nahihiya", "namuong", "nanay", "napkin", "nasusuka", "nauseous", "neck", "negative", "not", "note", "nurse", "nursing", "nutrition", "obgyn", "odor", "oily", "older", "opk", "options", "orange", "out", "outside", "ovarian", "ovaries", "ovary", "ovulate", "ovulating", "ovulation", "ovulatory", "ovum", "pabago", "pad", "pads", "pagkain", "pagod", "pagreregla", "painkiller", "pale", "pamahiin", "pampawala", "panganganak", "panic", "panties", "pantyliner", "pantyliners", "parents", "partner", "patak", "pcos", "pee", "pelvic", "perimenopause", "period", "periods", "phase", "phases", "pill", "pills", "pimple", "pimples", "plan", "planning", "pmdd", "pms", "polycystic", "poop", "positive", "postpartum", "predict", "prediction", "predictor", "pregnancy", "pregnant", "premenstrual", "prepare", "preparing", "pressure", "prevent", "privacy", "private", "problema", "product", "products", "professional", "progesterone", "protection", "puberty", "purpose", "puson", "puti", "puyat", "questions", "rage", "ran", "rash", "reason", "record", "regla", "regular", "reliable", "relief", "relieve", "reliever", "remedies", "remedy", "return", "reusable", "rise", "risk", "running", "sac", "screening", "secure", "see", "sees", "severe", "sex", "sexually", "sharp", "shock", "shower", "shy", "sign", "signs", "siklo", "silicone", "skipped", "sleepy", "soaking", "soap", "sobrang", "sour", "sport", "spot", "spotting", "std", "sterilize", "steroid", "sti", "sticky", "stomach", "stool", "stored", "straight", "stressed", "stretchy", "strip", "sugar", "sunburn", "supplies", "support", "sweats", "swimming", "swollen", "symptoms", "syndrome", "tae", "tagihawat", "talking", "tampon", "tampons", "teenager", "temp", "temperature", "testing", "texture", "thermometer", "thigh", "thinner", "throwing", "thrush", "thyroid", "tips", "tiredness", "too", "totoo", "toxic", "track", "tracking", "transmitted", "trust", "trying", "tss", "ttc", "ulo", "ultrasound", "unang", "understand", "underwear", "unpredictable", "unprotected", "upset", "urgent", "urinary", "urine", "useful", "using", "usually", "uterine", "uterus", "uti", "vagina", "vaginal", "vaginosis", "varies", "vegetables", "very", "visit", "vital", "vomit", "vomiting", "vulva", "warning", "wash", "washable", "wet", "while", "window", "wine", "womb", "workout", "worst", "worth", "yeast", "yoga", "you", "your", "zone"]);
