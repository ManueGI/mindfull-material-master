import { useEffect, useRef, useState } from 'react';
import { DataSet, Network } from 'vis-network/standalone';
import PropTypes from 'prop-types';

const NetworkComponent = ({ materials }) => {
    const containerRef = useRef(null);
    const [network, setNetwork] = useState(null); // Pour stocker le réseau
    const [materialNodes, setMaterialNodes] = useState([]);

    // useEffect pour gérer les catégories
    useEffect(() => {
        const uniqueCategories = [...new Set(materials.map(material => material.category))].filter(category => category);

        // Créer les nœuds à partir des catégories uniques
        const nodes = new DataSet(
            uniqueCategories.map((category, index) => ({
                id: index + 1, // Assurez-vous d'utiliser un identifiant unique
                label: category // Utilisez la catégorie comme label
            }))
        );

        const edges = new DataSet([]);
        const data = { nodes, edges };
        const options = {
            layout: {
                improvedLayout: false // Disable improved layout
            },
            nodes: {
                borderWidth: 0,
                shape: 'circle',
                color: { background: 'rgba(249, 44, 85, 0.8)', highlight: { background: '#F92C55', border: '#F92C55' } },
                font: { color: '#fff' }
            },
            physics: {
                stabilization: false,
                minVelocity: 0.01,
                solver: 'repulsion',
                repulsion: {
                    nodeDistance: 100
                }
            }
        };

        const networkInstance = new Network(containerRef.current, data, options);
        setNetwork(networkInstance); // Enregistrer l'instance du réseau

        return () => {
            networkInstance.destroy();
        };
    }, [materials]); // Ajoutez materials comme dépendance pour recharger les catégories

    // useEffect pour gérer les clics sur les catégories et les matériaux
    useEffect(() => {
        if (!network) return; // Assurez-vous que le réseau est initialisé

        // Gérer le clic sur une catégorie
        const handleCategoryClick = (e) => {
            if (e.nodes.length) {
                const categoryNodeId = e.nodes[0];
                const category = network.body.data.nodes.get(categoryNodeId).label; // Obtenir la catégorie du nœud cliqué

                // Filtrer les matériaux de la catégorie
                const materialsInCategory = materials.filter(material => material.category === category);

                // Supprimer les nœuds de matériaux précédemment affichés
                if (materialNodes.length) {
                    network.body.data.nodes.remove(materialNodes);
                }

                // Créer des nœuds pour les matériaux dans cette catégorie
                const newMaterialNodes = materialsInCategory.map((material, index) => {
                    const id = `m${index + 1}`; // Utiliser un identifiant unique pour chaque matériau
                    return {
                        id, // Assurez-vous que cet identifiant est unique
                        label: material.name, // Utiliser le nom du matériau comme label
                        color: 'rgba(0, 150, 136, 0.6)', // Exemple de couleur pour les nœuds de matériau
                    };
                });

                // Ajouter les nouveaux nœuds de matériaux et mettre à jour l'état
                network.body.data.nodes.add(newMaterialNodes);
                setMaterialNodes(newMaterialNodes.map(node => node.id)); // Mettre à jour l'état avec les IDs des nœuds
            } else {
                // Si aucun nœud n'est sélectionné, supprimer tous les nœuds de matériaux
                if (materialNodes.length) {
                    network.body.data.nodes.remove(materialNodes);
                    setMaterialNodes([]); // Réinitialiser l'état
                }
            }
        };

        network.on('click', handleCategoryClick);

        return () => {
            network.off('click', handleCategoryClick); // Nettoyage de l'événement
        };
    }, [network, materials, materialNodes]); // Dépendances pour gérer le réseau et les matériaux

    return (
        <div
            ref={containerRef}
            style={{
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 1,
            }}
        />
    );
};

NetworkComponent.propTypes = {
    materials: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            category: PropTypes.string.isRequired // Ajout de category pour la validation
        })
    ).isRequired
};

export default NetworkComponent;
