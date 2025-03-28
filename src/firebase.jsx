import { ref, set } from "firebase/database";
import { database } from "../firebase";

// Modification pour prendre en compte les nouveaux champs de données
function writeMaterialData(materialId, name, link, category, keywords, comments) {
  const keywordsArray = keywords ? keywords.split(',').map(keyword => keyword.trim()) : [];
  set(ref(database, 'materials/' + materialId), {
    name: name,
    link: link,
    category: category,
    keywords: keywordsArray,
    comments: comments
  }).then(() => {
    console.log('Material data saved successfully!');
  }).catch((error) => {
    console.error('Error writing material data:', error);
  });
}

export default writeMaterialData;
