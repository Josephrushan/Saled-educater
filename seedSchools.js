/**
 * Seed script to populate Firestore with 100 Western Cape schools
 * Run with: node seedSchools.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA2U8KqZI7KvLOXJI8bKPM4UZ_KjHPlUqM",
  authDomain: "educater-4c49b.firebaseapp.com",
  projectId: "educater-4c49b",
  storageBucket: "educater-4c49b.appspot.com",
  messagingSenderId: "854272485639",
  appId: "1:854272485639:web:e97e1a05f28e83f3b8df6f"
};

const schoolsData = [
  { name: "Bishops Diocesan College", location: "Rondebosch", principalEmail: "principal@bishops.org.za" },
  { name: "SACS High School", location: "Newlands", principalEmail: "highschool@sacs.org.za" },
  { name: "Rondebosch Boys' High", location: "Rondebosch", principalEmail: "infobhs@rondebosch.com" },
  { name: "Westerford High School", location: "Newlands", principalEmail: "admin@westerford.co.za" },
  { name: "Herschel Girls School", location: "Claremont", principalEmail: "head@herschel.org.za" },
  { name: "Rustenburg Girls' High", location: "Rondebosch", principalEmail: "info@rghs.org.za" },
  { name: "Wynberg Boys' High", location: "Wynberg", principalEmail: "secretaries@wbhs.org.za" },
  { name: "Wynberg Girls' High", location: "Wynberg", principalEmail: "seniorpost@wynghs.co.za" },
  { name: "Paul Roos Gymnasium", location: "Stellenbosch", principalEmail: "info@paulroos.co.za" },
  { name: "Rhenish Girls' High", location: "Stellenbosch", principalEmail: "info@rhenish.co.za" },
  { name: "Stellenbosch High", location: "Stellenbosch", principalEmail: "admin@stellies.com" },
  { name: "Paarl Boys' High", location: "Paarl", principalEmail: "head@paarlboyshigh.org.za" },
  { name: "Paarl Girls' High", location: "Paarl", principalEmail: "info@paarlgirlshigh.com" },
  { name: "Paarl Gymnasium", location: "Paarl", principalEmail: "info@paarlgym.co.za" },
  { name: "La Rochelle Girls' High", location: "Paarl", principalEmail: "info@larochelleghs.co.za" },
  { name: "Reddam House Atlantic", location: "Green Point", principalEmail: "info.atlanticseaboard@reddam.house" },
  { name: "Herzlia High School", location: "Vredehoek", principalEmail: "info@herzlia.com" },
  { name: "Camps Bay High School", location: "Camps Bay", principalEmail: "office@cbhs.co.za" },
  { name: "Parel Vallei High", location: "Somerset West", principalEmail: "secretary@parelvallei.org" },
  { name: "Strand High School", location: "Strand", principalEmail: "info@hshstrand.co.za" },
  { name: "Jan van Riebeeck High", location: "Gardens", principalEmail: "hjs@janvanriebeeck.co.za" },
  { name: "Pinelands High School", location: "Pinelands", principalEmail: "admin@phs.org.za" },
  { name: "Table View High", location: "Table View", principalEmail: "admin@tvh.co.za" },
  { name: "Fairmont High School", location: "Durbanville", principalEmail: "info@fairmont.co.za" },
  { name: "Durbanville High", location: "Durbanville", principalEmail: "durbanville.hs@wcgschools.gov.za" },
  { name: "Milnerton High School", location: "Milnerton", principalEmail: "info@milnertonhigh.co.za" },
  { name: "South Peninsula High", location: "Diep River", principalEmail: "admin@sphigh.org" },
  { name: "Bergvliet High School", location: "Bergvliet", principalEmail: "admin@bshs.org.za" },
  { name: "Fish Hoek High School", location: "Fish Hoek", principalEmail: "info@fishhoekhighschool.co.za" },
  { name: "Groote Schuur High", location: "Newlands", principalEmail: "info@gshs.co.za" },
  { name: "Claremont High School", location: "Claremont", principalEmail: "office@claremonthigh.co.za" },
  { name: "Livingstone High School", location: "Claremont", principalEmail: "admin@livingstonehigh.co.za" },
  { name: "Sans Souci Girls' High", location: "Newlands", principalEmail: "office@sanssouci.co.za" },
  { name: "Springfield Convent", location: "Wynberg", principalEmail: "sfshigh@sfshigh.org" },
  { name: "Constantia Waldorf", location: "Constantia", principalEmail: "admin@waldorfconstantia.co.za" },
  { name: "Reddam House Constantia", location: "Constantia", principalEmail: "info.constantia@reddam.house" },
  { name: "American International", location: "Constantia", principalEmail: "admissions@aisct.org" },
  { name: "International School Hout Bay", location: "Hout Bay", principalEmail: "info@houtbay.ies-net.com" },
  { name: "Hout Bay High School", location: "Hout Bay", principalEmail: "houtbay.sec@wcgschools.gov.za" },
  { name: "Bridge House School", location: "Franschhoek", principalEmail: "info@bridgehouse.org.za" },
  { name: "Somerset College", location: "Somerset West", principalEmail: "info@somersetcollege.org" },
  { name: "Helderberg High School", location: "Somerset West", principalEmail: "admin@helderberghigh.co.za" },
  { name: "Hottentots Holland High", location: "Somerset West", principalEmail: "admin@hhh.org.za" },
  { name: "Curro Durbanville", location: "Durbanville", principalEmail: "info.durbanville@curro.co.za" },
  { name: "Stellenberg High School", location: "Durbanville", principalEmail: "info@stellenberg.org.za" },
  { name: "Bellville High School", location: "Bellville", principalEmail: "admin@hsb.co.za" },
  { name: "DF Malan High School", location: "Bellville", principalEmail: "admin@dfmalan.com" },
  { name: "Tygerberg High School", location: "Parow", principalEmail: "admin@hstygerberg.co.za" },
  { name: "President High School", location: "Vrijzee", principalEmail: "admin@hspresident.co.za" },
  { name: "Settlers High School", location: "Bellville", principalEmail: "info@settlers.org.za" },
  { name: "Brackenfell High School", location: "Brackenfell", principalEmail: "info@hsbrackenfell.co.za" },
  { name: "Monument Park High", location: "Kraaifontein", principalEmail: "admin@mphs.co.za" },
  { name: "Eben Donges High", location: "Kraaifontein", principalEmail: "ed@ebendonges.co.za" },
  { name: "Parklands College", location: "Parklands", principalEmail: "director@parklands.co.za" },
  { name: "CBC St John's", location: "Parklands", principalEmail: "info@cbcstjohns.co.za" },
  { name: "Elkanah House", location: "Sunningdale", principalEmail: "info@elkanah.co.za" },
  { name: "Melkbosstrand High", location: "Melkbosstrand", principalEmail: "info@hsmelkbos.co.za" },
  { name: "Bloubergrant High", location: "Blouberg", principalEmail: "info@bghs.co.za" },
  { name: "West Coast Christian", location: "Big Bay", principalEmail: "info@westcoastchristian.co.za" },
  { name: "Cape Town High School", location: "Gardens", principalEmail: "info@capetownhigh.co.za" },
  { name: "Sea Point High School", location: "Sea Point", principalEmail: "admin@seapointhigh.co.za" },
  { name: "Harold Cressy High", location: "District Six", principalEmail: "admin@hchigh.org.za" },
  { name: "Trafalgar High School", location: "District Six", principalEmail: "admin@trafalgarhigh.co.za" },
  { name: "Zonnebloem NEST High", location: "Zonnebloem", principalEmail: "admin@znesths.co.za" },
  { name: "Good Hope Seminary", location: "Gardens", principalEmail: "admin@ghs.co.za" },
  { name: "Alexander Sinton High", location: "Athlone", principalEmail: "admin@sinton.org.za" },
  { name: "Belgravia High School", location: "Athlone", principalEmail: "admin@belgraviahigh.co.za" },
  { name: "Athlone High School", location: "Athlone", principalEmail: "athlone.sec@wcgschools.gov.za" },
  { name: "Cathkin High School", location: "Heideveld", principalEmail: "admin@cathkinhigh.org" },
  { name: "Silverlea Secondary", location: "Athlone", principalEmail: "admin@silverlea.org" },
  { name: "Windsor High School", location: "Lansdowne", principalEmail: "admin@windsorhigh.co.za" },
  { name: "Islamia College", location: "Lansdowne", principalEmail: "info@islamiacollege.co.za" },
  { name: "Portia Primary", location: "Lansdowne", principalEmail: "portia.prim@wcgschools.gov.za" },
  { name: "Muizenberg High School", location: "Muizenberg", principalEmail: "admin@muizenberghigh.org.za" },
  { name: "Lavender Hill High", location: "Steenberg", principalEmail: "admin@lavenderhillhigh.org.za" },
  { name: "Steenberg High School", location: "Steenberg", principalEmail: "admin@steenberg-high.org" },
  { name: "Sibelius High School", location: "Steenberg", principalEmail: "admin@sibeliushigh.co.za" },
  { name: "Grassdale High School", location: "Grassy Park", principalEmail: "admin@grassdalehigh.org" },
  { name: "Plumstead High School", location: "Plumstead", principalEmail: "admin@plumsteadhigh.co.za" },
  { name: "Norman Henshilwood", location: "Constantia", principalEmail: "admin@normanhenshilwoodhigh.co.za" },
  { name: "Voortrekker High", location: "Kenilworth", principalEmail: "admin@hsvoortrekker.co.za" },
  { name: "Oude Molen Tech", location: "Pinelands", principalEmail: "info@oudemolen.org.za" },
  { name: "Maitland High School", location: "Maitland", principalEmail: "admin@maitlandhigh.co.za" },
  { name: "Kensington High", location: "Kensington", principalEmail: "admin@kensingtonhigh.org" },
  { name: "Windermere High", location: "Factreton", principalEmail: "admin@windermerehigh.org" },
  { name: "Edgemead High School", location: "Edgemead", principalEmail: "admin@edgemeadhigh.org.za" },
  { name: "Bosmansdam High", location: "Bothasig", principalEmail: "info@bosmansdam.co.za" },
  { name: "De Kuilen High School", location: "Kuils River", principalEmail: "admin@dkkuilen.co.za" },
  { name: "Kuils River Tech", location: "Kuils River", principalEmail: "admin@krts.co.za" },
  { name: "Labori High School", location: "Paarl", principalEmail: "admin@laborihs.co.za" },
  { name: "Boland Agricultural", location: "Paarl", principalEmail: "admin@bolandlandbou.co.za" },
  { name: "Hugenote High School", location: "Wellington", principalEmail: "admin@hugenote.com" },
  { name: "Wellington High", location: "Wellington", principalEmail: "admin@wellingtonhigh.co.za" },
  { name: "Worcester Gymnasium", location: "Worcester", principalEmail: "admin@worcestergym.co.za" },
  { name: "Montana High School", location: "Worcester", principalEmail: "admin@hsmontana.co.za" },
  { name: "Hermanus High School", location: "Hermanus", principalEmail: "admin@hermanushigh.co.za" },
  { name: "Overberg High School", location: "Caledon", principalEmail: "admin@hsoverberg.co.za" },
  { name: "Swartland High School", location: "Malmesbury", principalEmail: "admin@hsswartland.co.za" },
  { name: "Malmesbury High", location: "Malmesbury", principalEmail: "admin@malmesburyhigh.org" }
];

async function seedDatabase() {
  try {
    console.log("🔥 Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("🗑️  Deleting existing schools...");
    const schoolsCollection = collection(db, "schools");
    const snapshot = await getDocs(schoolsCollection);
    
    let deletedCount = 0;
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, "schools", docSnapshot.id));
      deletedCount++;
    }
    console.log(`✅ Deleted ${deletedCount} existing schools`);

    console.log("➕ Adding 100 new schools...");
    let addedCount = 0;
    
    for (const school of schoolsData) {
      await addDoc(schoolsCollection, {
        name: school.name,
        location: school.location,
        principalEmail: school.principalEmail,
        stage: "INITIAL_CONTACT", // Fresh schools start at initial contact
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: "",
        contacts: []
      });
      addedCount++;
      
      if (addedCount % 10 === 0) {
        console.log(`  Added ${addedCount}/${schoolsData.length}...`);
      }
    }

    console.log(`\n✨ All done! Successfully seeded database with 100 schools.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
