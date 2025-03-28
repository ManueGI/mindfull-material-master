// import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import{ useEffect, useState } from "react";
import {
  ref,
  onValue,
  push,
  update,
  remove,
} from "firebase/database";
import { database } from "../../firebase";

const Admin = () => {

  const navigate = useNavigate();

    const handleLogout = async () => {
      await signOut(auth);
      navigate('/login');
    };
  // Etat pour stocker la liste des matériaux
  const [materials, setMaterials] = useState([]);
  // Etat pour le formulaire (ajout ou édition)
  const [formData, setFormData] = useState({
    name: "",
    link: "",
    category: "",
    keywords: "",
    comments: "",
  });
  // Etat pour savoir si on est en mode édition (l'ID du matériau à éditer) ou ajout (null)
  const [editingId, setEditingId] = useState(null);

  // Chargement des matériaux depuis la DB
  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const unsubscribe = onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      const formattedMaterials = [];
      for (let id in data) {
        formattedMaterials.push({
          id,
          ...data[id],
        });
      }
      setMaterials(formattedMaterials);
    });
    return () => unsubscribe();
  }, []);

  // Mise à jour du formulaire lors de la saisie
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Traitement du formulaire (ajout ou édition)
  const handleSubmit = (e) => {
    e.preventDefault();
    const materialsRef = ref(database, "materials");

    // Conversion des mots-clés (entrée texte séparée par des virgules) en tableau
    const keywordsArray = formData.keywords
      ? formData.keywords.split(",").map((k) => k.trim())
      : [];

    if (editingId) {
      // Mise à jour d'un matériau existant
      const materialRef = ref(database, "materials/" + editingId);
      update(materialRef, {
        ...formData,
        keywords: keywordsArray,
      }).then(() => {
        // Réinitialiser le formulaire et le mode édition
        setEditingId(null);
        setFormData({
          name: "",
          link: "",
          category: "",
          keywords: "",
          comments: "",
        });
      });
    } else {
      // Ajout d'un nouveau matériau
      push(materialsRef, {
        ...formData,
        keywords: keywordsArray,
      }).then(() => {
        // Réinitialiser le formulaire
        setFormData({
          name: "",
          link: "",
          category: "",
          keywords: "",
          comments: "",
        });
      });
    }
  };

  // Suppression d'un matériau
  const handleDelete = (id) => {
    const materialRef = ref(database, "materials/" + id);
    remove(materialRef);
  };

  // Préparer le formulaire pour l'édition d'un matériau
  const handleEdit = (material) => {
    setEditingId(material.id);
    setFormData({
      name: material.name || "",
      link: material.link || "",
      category: material.category || "",
      keywords: material.keywords ? material.keywords.join(", ") : "",
      comments: material.comments || "",
    });
  };

  // Annuler le mode édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      link: "",
      category: "",
      keywords: "",
      comments: "",
    });
  };

  return (
    <div>
         <h1>Admin</h1>
         <button onClick={handleLogout}>Log out</button>

      {/* Formulaire d'ajout / édition */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <div>
          <label>Name :</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Link :</label>
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Category :</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Key words (separted by commas) :</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Comments :</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <button type="submit">
          {editingId ? "Edit" : "Add"}
        </button>
        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </form>

      {/* Tableau des matériaux */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Link</th>
            <th>Category</th>
            <th>Key words</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <tr key={material.id}>
              <td>{material.name}</td>
              <td>
                {material.link ? (
                  <a
                    href={material.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lien
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>{material.category}</td>
              <td>
                {material.keywords && Array.isArray(material.keywords)
                  ? material.keywords.join(", ")
                  : "-"}
              </td>
              <td>{material.comments}</td>
              <td>
                <button onClick={() => handleEdit(material)}>Edit</button>
                <button onClick={() => handleDelete(material.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
