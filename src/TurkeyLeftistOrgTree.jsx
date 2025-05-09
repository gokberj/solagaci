return (
    <div className="w-full overflow-x-auto">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold mb-2">Türkiye Sol Örgütleri Soy Ağacı</h1>
        <p className="text-gray-600 mb-4">Günümüzden 1920'lere - Bir örgüte tıklayarak soy ağacını görebilirsiniz</p>
        
        <div className="flex justify-center gap-4 flex-wrap mb-4 border-b border-gray-300 pb-4">
          <div className="flex items-center">
            <div className="w-6 h-1 bg-red-500 mr-2"></div>
            <span>Doğrudan Evrim</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-1 border-t-2 border-dashed border-red-500 mr-2"></div>
            <span>İdeolojik Etki</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-1 bg-red-500 mr-2"></div>
            <span>Bölünme/Birleşme</span>
          </div>
        </div>
      </div>
            
      <div className="relative overflow-x-auto overflow-y-auto" style={{ height: `${Math.min(1500, height + 100)}px` }}>
        <svg width={width} height={height + 100} onClick={clearSelection}>
          {/* Onlu Yıllar için yatay çizgiler ve gölgelemeler */}
          {[2030, 2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930, 1920].map((year, i) => {
            const y = i * levelHeight;
            return (
              <g key={year}>
                {/* Onlu yıl gölgeleme */}
                <rect
                  x={0} 
                  y={y - levelHeight/2} 
                  width={width}
                  height={levelHeight}
                  fill={i % 2 === 0 ? "#f5f5f5" : "#ffffff"}
                  stroke="none"
                />
                {/* Yıl çizgisi */}
                <line 
                  x1={0} y1={y} 
                  x2={width} y2={y} 
                  stroke="#ddd" 
                  strokeWidth={1} 
                />
                <text x={10} y={y - 10} fontSize={12} fill="#666" fontWeight="bold">
                  {year}{'\''}lar
                </text>
              </g>
            );
          })}
          
          {/* Bağlantı çizgileri */}
          {links.map((link, i) => {
            const isActive = selectedOrg && highlightedLinks.some(l => l.source === link.source && l.target === link.target);
            const midX = (link.sourceX + link.targetX) / 2;
            const midY = (link.sourceY + link.targetY) / 2;
            
            // Bağlantı türü etiketi
            let linkLabel = "";
            switch(link.type) {
              case "evolution": linkLabel = "Evrim"; break;
              case "split": linkLabel = "Bölünme"; break;
              case "renamed": linkLabel = "İsim Değişikliği"; break;
              case "merged": linkLabel = "Birleşme"; break;
              case "influence": linkLabel = "Etki"; break;
              case "inspiration": linkLabel = "İlham"; break;
              case "ideological": linkLabel = "İdeolojik Etki"; break;
              case "direct": linkLabel = "Doğrudan"; break;
              default: linkLabel = link.type;
            }
            
            return (
              <g key={`link-${i}`}>
                <path
                  d={`M${link.sourceX},${link.sourceY} C${link.sourceX},${(link.sourceY + link.targetY) / 2} ${link.targetX},${(link.sourceY + link.targetY) / 2} ${link.targetX},${link.targetY}`}
                  stroke={getLinkColor(link)}
                  strokeWidth={getLinkWidth(link)}
                  fill="none"
                  strokeDasharray={link.type === "ideological" ? "5,5" : "none"}
                  opacity={isHighlighted(link.source) && isHighlighted(link.target) ? 0.8 : 0.3}
                />
                
                {/* Bağlantı etiketi - sadece vurgulandığında göster */}
                {isActive && (
                  <>
                    {/* Beyaz arka plan (outline efekti için) */}
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      fontSize={10}
                      dy="-0.5em"
                      fontWeight="bold"
                      stroke="#ffffff"
                      strokeWidth={3}
                      fill="#ffffff"
                      paintOrder="stroke"
                    >
                      {linkLabel}
                    </text>
                    {/* Ana metin */}
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      fontSize={10}
                      dy="-0.5em"
                      fontWeight="bold"
                      fill={getLinkColor(link)}
                    >
                      {linkLabel}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          
          {/* Örgüt daireleri ve logoları */}
          {adjustedNodes.map(node => {
            const isHovered = hoveredOrg === node.id;
            return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node.id);
              }}
              onMouseEnter={() => setHoveredOrg(node.id)}
              onMouseLeave={() => setHoveredOrg(null)}
              style={{ cursor: 'pointer', opacity: isHighlighted(node.id) ? 1 : 0.4 }}
            >
              {/* Çember arka plan */}
              <circle
                r={nodeRadius}
                fill="#ffffff"
                stroke={node.id === selectedOrg ? getNodeColor(node) : "#999"}
                strokeWidth={node.id === selectedOrg ? 2 : 1}
              />
              
              {/* Logo */}
              <image
                href={node.logo}
                x={-nodeRadius * 0.8}
                y={-nodeRadius * 0.8}
                width={nodeRadius * 1.6}
                height={nodeRadius * 1.6}
                clipPath={`circle(${nodeRadius * 0.8}px at ${0} ${0})`}
              />
              
              {/* İsim etiketi - Beyaz arka plan ile */}
              <text
                y={nodeRadius + 15}
                textAnchor="middle"
                stroke="#ffffff"
                strokeWidth={4}
                paintOrder="stroke"
                fill={!selectedOrg || highlightedNodes.includes(node.id) ? "#000" : "#999"}
                fontSize={12}
                fontWeight={node.id === selectedOrg ? "bold" : "normal"}
              >
                {node.shortName}
              </text>
              
              {/* Kuruluş yılı - Beyaz arka plan ile */}
              <text
                y={nodeRadius + 30}
                textAnchor="middle"
                stroke="#ffffff"
                strokeWidth={4}
                paintOrder="stroke"
                fill="#666"
                fontSize={10}
              >
                {node.year}
              </text>
              
              {/* Bilgi Popup - Hover olunca göster */}
              {isHovered && partyDetails[node.id] && (
                <g>
                  {/* Popup Arka Planı */}
                  <rect
                    x={nodeRadius + 10}
                    y={-nodeRadius - 60}
                    width={220}
                    height={120}
                    rx={5}
                    fill="white"
                    stroke="#ccc"
                    strokeWidth={1}
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
                  />
                  {/* Popup Arrow */}
                  <path
                    d={`M${nodeRadius} 0 L${nodeRadius + 10} -10 L${nodeRadius + 10} 10 Z`}
                    fill="white"
                    stroke="#ccc"
                    strokeWidth={1}
                  />
                  {/* Parti Adı */}
                  <text
                    x={nodeRadius + 20}
                    y={-nodeRadius - 40}
                    fontWeight="bold"
                    fontSize={12}
                    fill="#333"
                  >
                    {partyDetails[node.id].fullName}
                  </text>
                  {/* Kurucular */}
                  <text
                    x={nodeRadius + 20}
                    y={-nodeRadius - 25}
                    fontSize={10}
                    fill="#555"
                  >
                    <tspan fontWeight="bold">Kurucular:</tspan> {partyDetails[node.id].founders}
                  </text>
                  {/* Bilgi Metni (Multi-line) */}
                  <foreignObject
                    x={nodeRadius + 20}
                    y={-nodeRadius - 10}
                    width={200}
                    height={60}
                  >
                    <div style={{ fontSize: "10px", color: "#555", fontFamily: "Arial", lineHeight: "1.2" }}>
                      {partyDetails[node.id].info}
                    </div>
                  </foreignObject>
                </g>
              )}
            </g>
          )})}
        </svg>
      </div>
      
      <div className="mt-8 border-t border-gray-300 pt-4">
        {selectedOrg && partyDetails[selectedOrg] && (
          <div className="mt-4">
            <h3 className="font-bold">
              {partyDetails[selectedOrg].fullName} Hakkında
            </h3>
            <p className="mt-2">
              {partyDetails[selectedOrg].info}
            </p>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500 mt-8">
        <p>Not: Bu görselleştirme CSV verilerine dayanmaktadır ve sürekli güncellenebilir.</p>
      </div>
    </div>
  );import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as d3 from 'd3';

export default function TurkeyLeftistOrgTree() {
  const [orgData, setOrgData] = useState({ nodes: [], links: [] });
  const [partyDetails, setPartyDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [highlightedLinks, setHighlightedLinks] = useState([]);
  const [hoveredOrg, setHoveredOrg] = useState(null);

  const levelHeight = 130;
  const width = 900;
  const height = 12 * levelHeight; // 12 onlu yıl (2030ler->1920ler)
  const nodeRadius = 35;

  // CSV'den veri yükleme
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Google Sheets CSV URL'si
        const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRx2IM2CyaMz9dkn7BxyEIpKnYEZGjMZUzlEgeYdN3CT3yCCY37AqNzxmil3EMj3PnEo7DMX2DyMY8j/pub?output=csv';
        
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error('CSV verileri yüklenemedi');
        }
        
        const csvText = await response.text();
        
        const result = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        if (result.data && result.data.length > 0) {
          console.log("CSV verileri yüklendi:", result.data);
          
          // Düğümler ve bağlantıları ayrıştır
          const nodes = result.data.map(row => ({
            id: row.id,
            name: row.isim,
            shortName: row.kisa_isim,
            year: row.kurulus,
            level: row.level || 0,
            color: row.renk || "#1976d2",
            logo: row.logo_url || "/api/placeholder/60/60",
            family: row.aile || "other",
            decade: Math.floor(row.kurulus / 10) * 10
          }));
          
          // Bağlantıları oluştur
          const links = result.data
            .filter(row => row.atasi_id) // Atası olan düğümleri filtrele
            .map(row => ({
              source: row.atasi_id,
              target: row.id,
              type: row.iliski_turu || "direct"
            }));
          
          // Parti detaylarını oluştur (popup için)
          const details = {};
          result.data.forEach(row => {
            details[row.id] = {
              fullName: row.isim,
              founders: row.kurucular || "Bilinmiyor",
              info: row.gorus || `${row.isim} hakkında bilgi bulunmuyor.`
            };
          });
          
          // Sonuçları state'e aktar
          setOrgData({ nodes, links });
          setPartyDetails(details);
          setLoading(false);
        } else {
          throw new Error('CSV verileri boş veya geçersiz format');
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Veriler yüklenene kadar yükleniyor göster
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumunda hata mesajı göster
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-500">
          <h3 className="text-xl font-bold mb-2">Veri Yükleme Hatası</h3>
          <p>{error}</p>
          <p className="mt-4 text-sm">CSV dosyasının doğru formatta olduğundan ve erişilebilir olduğundan emin olun.</p>
        </div>
      </div>
    );
  }

  const findAncestors = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    
    const directLinks = orgData.links.filter(link => link.target === nodeId);
    let ancestors = [...directLinks];
    
    for (const link of directLinks) {
      ancestors = [...ancestors, ...findAncestors(link.source, visited)];
    }
    
    return ancestors;
  };

  const findDescendants = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    
    const directLinks = orgData.links.filter(link => link.source === nodeId);
    let descendants = [...directLinks];
    
    for (const link of directLinks) {
      descendants = [...descendants, ...findDescendants(link.target, visited)];
    }
    
    return descendants;
  };

  const handleNodeClick = (orgId) => {
    setSelectedOrg(orgId);
    
    // Atalar ve torunları bul
    const ancestorLinks = findAncestors(orgId);
    const descendantLinks = findDescendants(orgId);
    
    // Tüm ilgili bağları birleştir
    const allLinks = [...ancestorLinks, ...descendantLinks];
    setHighlightedLinks(allLinks);
    
    // İlgili düğümleri topla
    const nodes = new Set();
    nodes.add(orgId);
    
    allLinks.forEach(link => {
      nodes.add(link.source);
      nodes.add(link.target);
    });
    
    setHighlightedNodes(Array.from(nodes));
  };

  const isHighlighted = (id) => {
    return !selectedOrg || highlightedNodes.includes(id);
  };

  const getLinkColor = (link) => {
    if (!selectedOrg) {
      return "#999";
    }
    return highlightedLinks.some(l => l.source === link.source && l.target === link.target) ? "#ff5722" : "#ddd";
  };

  const getLinkWidth = (link) => {
    if (!selectedOrg) return 2;
    return highlightedLinks.some(l => l.source === link.source && l.target === link.target) ? 3 : 1;
  };

  const getNodeColor = (node) => {
    if (!selectedOrg) return node.color || "#1976d2";
    return node.id === selectedOrg ? node.color || "#e91e63" : 
           highlightedNodes.includes(node.id) ? node.color || "#ff5722" : "#aaa";
  };

  const clearSelection = () => {
    setSelectedOrg(null);
    setHighlightedNodes([]);
    setHighlightedLinks([]);
  };

  // Her ailenin sütun indeksini belirle
  const columnOrder = ["TKP", "SOL", "HDP", "TIP", "EMEP", "DSP"];
  const columnAssignments = {};
  columnOrder.forEach((family, index) => {
    columnAssignments[family] = index;
  });
  
  // Özel aile atamalarını düzelt
  // Örneğin: orgData.nodes.forEach(node => {
  //   if (node.id === "TKP1920" || node.id === "TKP1920_ORIG") {
  //     node.family = "TKP";
  //   }
  // });

  // Düğümlerin x,y pozisyonlarını ayarlama
  const nodes = orgData.nodes.map(node => {
    // Ailenin sütun indeksi 
    const columnIndex = columnAssignments[node.family] !== undefined ? 
                        columnAssignments[node.family] : 
                        Object.keys(columnAssignments).length;
    
    // Sütun genişliği
    const columnWidth = width / Math.max(6, Object.keys(columnAssignments).length);
    
    // X pozisyonu: ailenin sütunu
    const x = columnWidth / 2 + columnIndex * columnWidth;
    
    // Onlu yıl hesapla (eğer CSV'de belirtilmemişse)
    const decade = node.decade || Math.floor(node.year / 10) * 10;
    
    // 2030'lar -> 0, 2020'lar -> 1, vs. olacak şekilde seviye indeksi hesapla
    const levelIndex = (2030 - decade) / 10;
    
    // Bazı yıllar için ek dikey ofseti ekle (1920'ler ve 2020'ler arasındaki mesafeyi artır)
    let extraOffset = 0;
    if (decade <= 1980) extraOffset = 20;
    if (decade <= 1960) extraOffset = 40;
    if (decade <= 1940) extraOffset = 60;
    if (decade <= 1920) extraOffset = 80;
    
    return {
      ...node,
      x: x,
      y: levelIndex * levelHeight + 70 + extraOffset,
      decade
    };
  });

  // Bağlantılı düğümler için çekim kuvvetleri uygula
  const linkForce = 0.2; // Çekim kuvveti faktörü
  const adjustedNodes = [...nodes];
  
  orgData.links.forEach(link => {
    const sourceNode = adjustedNodes.find(n => n.id === link.source);
    const targetNode = adjustedNodes.find(n => n.id === link.target);
    
    if (sourceNode && targetNode && sourceNode.x !== targetNode.x) {
      // Düğümlerin yatay çekim kuvvetini hesapla
      const dx = targetNode.x - sourceNode.x;
      const pull = dx * linkForce;
      
      // Düğümleri birbirine doğru çek
      sourceNode.x += pull / 2;
      targetNode.x -= pull / 2;
    }
  });
  
  // Çakışma tespiti ve düzeltmesi
  const nodePositions = {};
  
  // Poziyon çakışmalarını tespit et (daha kesin değerler için yuvarlama yapmadan)
  adjustedNodes.forEach(node => {
    // Yakın düğümleri gruplamak için daha geniş bir pozisyon aralığı kullan
    for (let x = Math.floor(node.x - nodeRadius); x <= Math.ceil(node.x + nodeRadius); x += 10) {
      const key = `${x}_${node.decade}`;
      if (!nodePositions[key]) {
        nodePositions[key] = [];
      }
      nodePositions[key].push(node.id);
    }
  });
  
  // Çakışan düğümleri düzenle - Önce grupları birleştir
  const collisionGroups = [];
  const processedNodes = new Set();
  
  Object.values(nodePositions).forEach(nodeIds => {
    if (nodeIds.length > 1) {
      // Bu gruptaki düğümleri al
      const nodesInThisGroup = new Set(nodeIds);
      
      // Bu düğümlerden herhangi biri zaten işlendiyse, hangi grupta olduğunu bul
      let existingGroupIndex = -1;
      nodesInThisGroup.forEach(nodeId => {
        if (processedNodes.has(nodeId)) {
          for (let i = 0; i < collisionGroups.length; i++) {
            if (collisionGroups[i].has(nodeId)) {
              existingGroupIndex = i;
              break;
            }
          }
        }
      });
      
      // Eğer bu düğümler zaten bir gruba aitse, o gruba ekle
      if (existingGroupIndex !== -1) {
        nodesInThisGroup.forEach(nodeId => {
          collisionGroups[existingGroupIndex].add(nodeId);
          processedNodes.add(nodeId);
        });
      }
      // Değilse, yeni bir grup oluştur
      else {
        collisionGroups.push(nodesInThisGroup);
        nodesInThisGroup.forEach(nodeId => {
          processedNodes.add(nodeId);
        });
      }
    }
  });
  
  // Her çakışma grubu için düğümleri yeniden konumlandır
  collisionGroups.forEach(group => {
    const nodeIds = Array.from(group);
    // Çakışan düğümleri yatay olarak dağıt
    const offset = 80; // Daha geniş bir ofset kullan
    const totalWidth = (nodeIds.length - 1) * offset;
    const startOffset = -totalWidth / 2;
    
    // Bu gruptaki düğümlerin ortalama x pozisyonunu bul
    const avgX = nodeIds.reduce((sum, nodeId) => {
      const node = adjustedNodes.find(n => n.id === nodeId);
      return sum + node.x;
    }, 0) / nodeIds.length;
    
    // Düğümleri ortalama pozisyon etrafında dağıt
    nodeIds.forEach((nodeId, index) => {
      const nodeIndex = adjustedNodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        adjustedNodes[nodeIndex].x = avgX + startOffset + (index * offset);
      }
    });
  });
  
  // Linkleri yeni düğüm pozisyonlarına göre güncelle
  const links = orgData.links.map(link => {
    const sourceNode = adjustedNodes.find(n => n.id === link.source);
    const targetNode = adjustedNodes.find(n => n.id === link.target);
    
    if (sourceNode && targetNode) {
      return {
        ...link,
        sourceX: sourceNode.x,
        sourceY: sourceNode.y,
        targetX: targetNode.x,
        targetY: targetNode.y
      };
    }
    return null;
  }).filter(link => link !== null); // Null değerleri filtrele