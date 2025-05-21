import "./Admin.css";
// import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { database } from "../../firebase";
import Papa from "papaparse";

const Admin = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [formData, setFormData] = useState({
    name: "",
    link: "",
    category: "",
    subCategory: "",
    keywords: "",
    comments: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Handle CSV upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const materialsRef = ref(database, "materials");
        const promises = results.data.map((row) => {
          // Make column matching case-insensitive
          const get = (key) => {
            const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
            return found ? row[found] : "";
          };
          const keywords = get("Keywords") ? get("Keywords").split(/[,|]/).map(k => k.trim()).filter(Boolean) : [];
          return push(materialsRef, {
            name: get("Name"),
            link: get("Link"),
            category: get("Material category"),
            subCategory: get("Subcategory"),
            keywords,
            comments: get("Comments"),
            createdAt: Date.now(),
          });
        });
        await Promise.all(promises);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: () => setLoading(false),
    });
  };

  // Loading materials from the DB
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
      formattedMaterials.sort((a, b) => {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setMaterials(formattedMaterials);
    });
    return () => unsubscribe();
  }, []);

  // Update the form when typing
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Extract unique categories from materials
  const uniqueCategories = [
    ...new Set(materials.map((material) => material.category).filter(Boolean)),
  ];
  // Extract unique subcategories from materials
  const uniqueSubCategories = [
    ...new Set(materials.map((material) => material.subCategory).filter(Boolean)),
  ];

  // Form processing (add or edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    const materialsRef = ref(database, "materials");

    const keywordsArray = formData.keywords
      ? formData.keywords.split(",").map((k) => k.trim())
      : [];

    if (editingId) {
      const materialRef = ref(database, "materials/" + editingId);
      update(materialRef, {
        ...formData,
        keywords: keywordsArray,
        // You can decide not to modify createdAt when editing
      }).then(() => {
        setEditingId(null);
        setFormData({
          name: "",
          link: "",
          category: "",
          subCategory: "",
          keywords: "",
          comments: "",
        });
      });
    } else {
      // Add new material with createdAt field
      push(materialsRef, {
        ...formData,
        keywords: keywordsArray,
        createdAt: Date.now(),
      }).then(() => {
        setFormData({
          name: "",
          link: "",
          category: "",
          subCategory: "",
          keywords: "",
          comments: "",
        });
      });
    }
  };

  // Delete a material
  const handleDelete = (id) => {
    const materialRef = ref(database, "materials/" + id);
    remove(materialRef);
  };

  // Prepare the form for editing a material
  const handleEdit = (material) => {
    setEditingId(material.id);
    setFormData({
      name: material.name || "",
      link: material.link || "",
      category: material.category || "",
      subCategory: material.subCategory || "",
      keywords: material.keywords ? material.keywords.join(", ") : "",
      comments: material.comments || "",
    });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      link: "",
      category: "",
      subCategory: "",
      keywords: "",
      comments: "",
    });
  };

  // Apply dynamic sorting based on user choice
  const sortedMaterials = [...materials].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "category") {
      return (a.category || "").localeCompare(b.category || "");
    } else {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  // Helper to highlight search matches
  const highlightMatch = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return String(text).split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} style={{background: '#ffe066', padding: 0}}>{part}</mark> : part
    );
  };

  // Filter materials based on search
  const filteredMaterials = sortedMaterials.filter((material) => {
    const searchLower = search.toLowerCase();
    return (
      material.name?.toLowerCase().includes(searchLower) ||
      (Array.isArray(material.keywords) && material.keywords.join(", ").toLowerCase().includes(searchLower)) ||
      material.category?.toLowerCase().includes(searchLower) ||
      material.subCategory?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
          <div className="csv-upload-bar" style={{ marginTop: 10 }}>
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleCSVUpload}
            />
            {loading ? (
              <span className="csv-loader" style={{minWidth: 120, display: 'inline-block', textAlign: 'center'}}>Uploading...</span>
            ) : (
              <>
                <button
                  type="button"
                  className="form-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={loading}
                >
                  Upload CSV
                </button>
                <button
                  type="button"
                  className="form-btn"
                  onClick={() => {
                    // Prepare CSV content
                    const headers = [
                      'Name',
                      'Link',
                      'Material category',
                      'Subcategory',
                      'Keywords',
                      'Comments'
                    ];
                    const rows = materials.map(m => [
                      m.name || '',
                      m.link || '',
                      m.category || '',
                      m.subCategory || '',
                      Array.isArray(m.keywords) ? m.keywords.join(', ') : (m.keywords || ''),
                      m.comments || ''
                    ]);
                    const csv = [headers.join(','), ...rows.map(r => r.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `materials_${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  disabled={loading}
                >
                  Download CSV
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Link:</label>
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            placeholder="Type a new category or select one"
            list="category-list"
          />
          <datalist id="category-list">
            {uniqueCategories.map((cat, index) => (
              <option key={index} value={cat} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>Subcategory:</label>
          <input
            type="text"
            name="subCategory"
            value={formData.subCategory}
            onChange={handleInputChange}
            placeholder="Type a new subcategory or select one"
            list="subcategory-list"
          />
          <datalist id="subcategory-list">
            {uniqueSubCategories.map((sub, index) => (
              <option key={index} value={sub} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>Keywords (separated by commas):</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label>Comments:</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
            className="comments-textarea"
          ></textarea>
        </div>
        <div className="form-actions">
          <button type="submit" className="form-btn">{editingId ? "Save changes" : "Add"}</button>
          {editingId && (
            <button type="button" className="form-btn cancel-btn" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-sort">
        <label>Sorted by:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Created at</option>
          <option value="name">Name (A-Z)</option>
          <option value="category">Material category (A-Z)</option>
        </select>
      </div>

      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="Search by name, keywords, or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Materials table */}
      <table className="admin-table" border="0" cellPadding="0">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Link</th>
            <th>Material category</th>
            <th>Subcategory</th>
            <th>Keywords</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMaterials.map((material, index) => (
            <tr key={material.id}>
              <td>{index + 1}</td>
              <td>{highlightMatch(material.name, search)}</td>
              <td>
                {material.link ? (
                  <a
                    href={material.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Link
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>{highlightMatch(material.category, search)}</td>
              <td>{highlightMatch(material.subCategory, search)}</td>
              <td>
                {material.keywords && Array.isArray(material.keywords)
                  ? highlightMatch(material.keywords.join(", "), search)
                  : "-"}
              </td>
              <td>{material.comments}</td>
              <td className="admin-actions">
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
