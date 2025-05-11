import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbwvhTlVgW9A0p1xx40Y237aWyluAA4bp8NvXw5h4uO33VJXn7ZtOrYMR1aI0vrR60XP/exec';

export default function TurkeyLeftistOrgTree() {
  const [hoveredOrg, setHoveredOrg] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [hoveredLinks, setHoveredLinks] = useState([]);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [orgData, setOrgData] = useState({nodes: [], links: []});
  const [partyDetails, setPartyDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const levelHeight = 100;
  const nodeRadius = 35;
  const minYear = 1920;
  const maxYear = 2025;
  const yearRange = maxYear - minYear;
  // Grid için yatay hücre sayısı
  const GRID_COLUMNS = 13;

  // Pencere boyutu değişimini izle
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Dış alana tıklama işlemi için event listener ekle
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // SVG elemanının dışına tıklandı mı kontrol et
      if (svgRef.current && !svgRef.current.contains(e.target)) {
        // Seçili node'u temizle
        setSelectedOrg(null);
        setSelectedLinks([]);
      }
    };
    
    // Timeline container'ına tıklama işlemi için event listener
    const handleTimelineClick = (e) => {
      // Eğer doğrudan timeline container'ına tıklandıysa (SVG veya node'lar hariç)
      if (e.target.classList.contains('timeline-container') || 
          e.target.classList.contains('decade-background') || 
          e.target.classList.contains('year-line')) {
        setSelectedOrg(null);
        setSelectedLinks([]);
      }
    };
    
    // Event listener'ları ekle
    document.addEventListener('mousedown', handleOutsideClick);
    const timelineContainer = document.querySelector('.timeline-container');
    if (timelineContainer) {
      timelineContainer.addEventListener('click', handleTimelineClick);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (timelineContainer) {
        timelineContainer.removeEventListener('click', handleTimelineClick);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(GOOGLE_SHEETS_API_URL);
        const result = await response.json();
        
        if (result && result.length > 0) {
          const nodes = result.map(row => ({
            id: row.id,
            name: row.isim,
            shortName: row.kisa_isim,
            year: parseInt(row.kurulus) || 2000,
            level: parseInt(row.level) || 0,
            color: row.renk || "#1976d2",
            logo: row.logo_url || "/api/placeholder/60/60",
            family: row.aile || row.id,
            status: row.durum || "Aktif",
            armed: row.silahli === "Evet" || row.silahli === "evet" || row.silahli === "E" || row.silahli === "e" || false
          }));
          
          const links = [];
          result.forEach(row => {
            if (row.atasi_id && row.atasi_id.trim() !== "") {
              links.push({
                source: row.atasi_id,
                target: row.id,
                type: row.iliski_turu || "direct"
              });
            }
          });
          
          const details = {};
          result.forEach(row => {
            details[row.id] = {
              fullName: row.isim || "",
              founders: row.kurucular || "",
              info: row.gorus || "",
              status: row.durum || "Aktif",
              startYear: row.kurulus || "",
              endYear: row.kapanis || "",
              website: row.url || "",
              armed: row.silahli === "Evet" || row.silahli === "evet" || row.silahli === "E" || row.silahli === "e" || false
            };
          });
          
          setOrgData({
            nodes: nodes,
            links: links
          });
          setPartyDetails(details);
        } else {
          throw new Error('Veri formatı beklendiği gibi değil veya boş veri döndü');
        }
      } catch (err) {
        console.error('Veri getirme hatası:', err);
        setError('API error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && svgRef.current) {
      const nodes = d3.selectAll('.node-circle');
      nodes
        .attr('opacity', 0)
        .attr('r', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .attr('opacity', 1)
        .attr('r', nodeRadius);
      
      const links = d3.selectAll('.link-path');
      links
        .attr('stroke-dasharray', function() {
          return this.getTotalLength();
        })
        .attr('stroke-dashoffset', function() {
          return this.getTotalLength();
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 10 + 300)
        .attr('stroke-dashoffset', 0);

      const labels = d3.selectAll('.node-label');
      labels
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay((d, i) => i * 20 + 700)
        .attr('opacity', 1);
    }
  }, [loading]);

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

  const handleNodeHover = (orgId) => {
    if (orgId) {
      setHoveredOrg(orgId);
      
      const ancestorLinks = findAncestors(orgId);
      const descendantLinks = findDescendants(orgId);
      
      const allLinks = [...ancestorLinks, ...descendantLinks];
      setHoveredLinks(allLinks);
    } else {
      setHoveredOrg(null);
      setHoveredLinks([]);
    }
  };
  
  const handleNodeClick = (orgId) => {
    if (selectedOrg === orgId) {
      // Zaten seçili olan node'a tıklandığında seçimi kaldır
      setSelectedOrg(null);
      setSelectedLinks([]);
    } else {
      // Yeni bir node seçildiğinde o node'u ve bağlantılarını işaretle
      setSelectedOrg(orgId);
      
      const ancestorLinks = findAncestors(orgId);
      const descendantLinks = findDescendants(orgId);
      
      const allLinks = [...ancestorLinks, ...descendantLinks];
      setSelectedLinks(allLinks);
    }
  };

  const isHovered = (id) => {
    if (selectedOrg) {
      // Bir node seçiliyse, hover efektlerini devre dışı bırak
      return false;
    }
    
    if (!hoveredOrg) return false;
    
    if (id === hoveredOrg) return true;
    
    const hoveredNodeIds = new Set();
    hoveredNodeIds.add(hoveredOrg);
    
    hoveredLinks.forEach(link => {
      hoveredNodeIds.add(link.source);
      hoveredNodeIds.add(link.target);
    });
    
    return hoveredNodeIds.has(id);
  };
  
  const isSelected = (id) => {
    if (!selectedOrg) return false;
    
    if (id === selectedOrg) return true;
    
    const selectedNodeIds = new Set();
    selectedNodeIds.add(selectedOrg);
    
    selectedLinks.forEach(link => {
      selectedNodeIds.add(link.source);
      selectedNodeIds.add(link.target);
    });
    
    return selectedNodeIds.has(id);
  };

  const getLinkColor = (link) => {
    // Seçili link varsa onun rengi
    if (selectedOrg && selectedLinks.some(l => l.source === link.source && l.target === link.target)) {
      return getTypeColor(link.type);
    }
    
    // Hover durumundaki link rengi
    if (!selectedOrg && hoveredOrg && hoveredLinks.some(l => l.source === link.source && l.target === link.target)) {
      return getTypeColor(link.type);
    }
    
    // Normal durum
    return "#ddd";
  };
  
  const getTypeColor = (type) => {
    switch(type) {
      case "evolution": return "#2196F3";
      case "split": return "#FF5722";
      case "renamed": return "#4CAF50";
      case "merged": return "#9C27B0";
      case "influence": return "#FFC107";
      case "inspiration": return "#E91E63";
      case "ideological": return "#795548";
      case "direct": return "#607D8B";
      default: return "#999";
    }
  };

  const getLinkWidth = (link) => {
    // Seçili link ise kalın çizgi
    if (selectedOrg && selectedLinks.some(l => l.source === link.source && l.target === link.target)) {
      return 3;
    }
    
    // Hover durumundaki link kalınlığı
    if (!selectedOrg && hoveredOrg && hoveredLinks.some(l => l.source === link.source && l.target === link.target)) {
      return 3;
    }
    
    // Normal kalınlık
    return 1.5;
  };

  const getNodeColor = (node) => {
    // Seçili node rengi
    if (isSelected(node.id)) {
      return node.color || "#1976d2";
    }
    
    // Hover durumundaki node rengi
    if (!selectedOrg && isHovered(node.id)) {
      return node.color || "#1976d2";
    }
    
    // Seçili veya hover varken, ilgili olmayan node rengi
    if ((selectedOrg && !isSelected(node.id)) || (hoveredOrg && !isHovered(node.id) && !selectedOrg)) {
      return "#aaa";
    }
    
    // Normal renk
    return node.color || "#1976d2";
  };

  const getNodeStrokeColor = (node) => {
    if (node.armed) {
      return "#ff0000";
    }
    
    if (node.status === "Aktif") {
      return "#4CAF50";
    }
    
    return "#999999";
  };

  const getNodeOpacity = (node) => {
    // Seçili node opasitesi
    if (selectedOrg) {
      return isSelected(node.id) ? 1 : 0.4;
    }
    
    // Hover durumundaki node opasitesi
    if (hoveredOrg) {
      return isHovered(node.id) ? 1 : 0.4;
    }
    
    // Normal opasite
    return 1;
  };

  const getLinkOpacity = (link) => {
    // Seçili link opasitesi
    if (selectedOrg) {
      return selectedLinks.some(l => l.source === link.source && l.target === link.target) ? 0.9 : 0.15;
    }
    
    // Hover durumundaki link opasitesi
    if (hoveredOrg) {
      return hoveredLinks.some(l => l.source === link.source && l.target === link.target) ? 0.9 : 0.15;
    }
    
    // Normal opasite
    return 0.6;
  };

  // Grid sisteminde node'ları hizala ve konumlandır
  const positionNodes = (nodes) => {
    const adjustedNodes = [...nodes];
    
    // 10'lu yıllara göre node'ları grupla
    const decadeGroups = {};
    adjustedNodes.forEach(node => {
      const decade = Math.floor(node.year / 10) * 10;
      if (!decadeGroups[decade]) {
        decadeGroups[decade] = [];
      }
      decadeGroups[decade].push(node);
    });
    
    // Her 10'lu yıl için grid hücre genişliğini hesapla ve nodeları konumlandır
    Object.entries(decadeGroups).forEach(([decade, nodesInDecade]) => {
      const decadeInt = parseInt(decade);
      
      // Sonraki decade'i hesapla
      const nextDecade = decadeInt + 10;
      
      // İki çizgi arasındaki mesafeyi hesapla
      const decadeYPosition = ((maxYear - decadeInt) / yearRange) * height + 50;
      const nextDecadeYPosition = ((maxYear - nextDecade) / yearRange) * height + 50;
      
      // Decade çizgileri arasında ortalama y pozisyonu
      const y = (decadeYPosition + nextDecadeYPosition) / 2;
      
      // Gruptaki node sayısı
      const count = nodesInDecade.length;
      
      // Node'ları sırala (yıllarına göre sırala)
      nodesInDecade.sort((a, b) => a.year - b.year);
      
      // Node'lar arası mesafe (gerçekten merkezlenmiş olması için)
      const nodeSpacing = 90; // Nodelar arasındaki mesafe 
      
      // Tüm nodelar için gerekli toplam genişlik
      const totalWidth = (count - 1) * nodeSpacing;
      
      // Başlangıç pozisyonu (tüm nodeları ortaya hizalamak için)
      const startX = (svgWidth - totalWidth) / 2;
      
      // Her node için konumu hesapla
      nodesInDecade.forEach((node, index) => {
        // X pozisyonu hesapla (ortada toplanmış)
        const xPos = startX + (index * nodeSpacing);
        
        // Node'u güncelle
        const nodeToUpdate = adjustedNodes.find(n => n.id === node.id);
        if (nodeToUpdate) {
          nodeToUpdate.x = xPos;
          nodeToUpdate.y = y;
        }
      });
    });
    
    return adjustedNodes;
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-500">
          <h3 className="text-xl font-bold mb-2">API error</h3>
        </div>
      </div>
    );
  }

  // Tam ekran genişliği kullan (margin'siz)
  const fullWidth = windowWidth;
  const svgWidth = fullWidth;
  const height = 12 * levelHeight;

  // Node'ları konumlandır
  const adjustedNodes = positionNodes(orgData.nodes);

  // Bağlantıları güncelle
  const links = orgData.links.map(link => {
    const sourceNode = adjustedNodes.find(n => n.id === link.source);
    const targetNode = adjustedNodes.find(n => n.id === link.target);
    
    if (!sourceNode || !targetNode) {
      return null;
    }
    
    return {
      ...link,
      sourceX: sourceNode.x,
      sourceY: sourceNode.y,
      targetX: targetNode.x,
      targetY: targetNode.y
    };
  }).filter(link => link !== null);

  // Onlu yıl etiketleri
  const decadeLabels = [];
  for (let year = 2020; year >= 1920; year -= 10) {
    const yearPosition = ((maxYear - year) / yearRange) * height + 50;
    
    decadeLabels.push({
      year: year,
      y: yearPosition
    });
  }

  // Grid çizgilerini göster
  const gridLines = [];
  for (let i = 1; i < GRID_COLUMNS; i++) {
    const x = (svgWidth / GRID_COLUMNS) * i;
    gridLines.push(x);
  }

  return (
    <div ref={containerRef} className="full-width-container">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold mb-2">Türkiye Sol Örgütleri Soy Ağacı</h1>
      </div>
      
      <div className="timeline-container" style={{ position: 'relative', height: `${Math.min(1500, height + 100)}px`, overflow: 'hidden' }}>
        {/* Onlu Yılların Arkaplan Şeritleri */}
        {decadeLabels.map((decade, i) => {
          const nextDecadeIndex = i + 1;
          const nextDecadeY = nextDecadeIndex < decadeLabels.length ? 
                            decadeLabels[nextDecadeIndex].y : 
                            ((maxYear - (minYear - 10)) / yearRange) * height + 50;
          
          return (
            <div
              key={`decade-${decade.year}`}
              className="decade-background"
              style={{
                position: 'absolute',
                top: decade.y,
                left: 0,
                right: 0,
                width: '100vw',
                height: nextDecadeY - decade.y,
                backgroundColor: i % 2 === 0 ? "#f9f9f9" : "#ffffff",
                zIndex: 1
              }}
            />
          );
        })}
        
        {/* Onlu Yıl Çizgileri */}
        {decadeLabels.map(decade => (
          <div
                          key={`yearline-${decade.year}`}
              className="year-line"
            style={{
              position: 'absolute',
              top: decade.y,
              left: 0,
              right: 0,
              width: '100vw',
              height: 0.5,
              backgroundColor: "#000",
              zIndex: 2
            }}
          >
            <div 
              style={{
                position: 'absolute',
                left: 8,
                top: -14,
                fontSize: 12,
                fontWeight: 'bold',
                color: '#666'
              }}
            >
              {decade.year}
            </div>
          </div>
        ))}
        
        {/* Görünmez Grid Çizgileri (Debug için görünür yapabilirsiniz) */}
        {gridLines.map((x, i) => (
          <div
            key={`gridline-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: x,
              width: 1,
              height: '100%',
              backgroundColor: "transparent", /* Görünmez */
              zIndex: 2,
              opacity: 0 /* Tamamen görünmez */
            }}
          />
        ))}
        
        {/* SVG İçeriği */}
        <div 
          style={{ 
            position: 'relative',
            width: `${svgWidth}px`,
            height: `${height + 100}px`,
            zIndex: 10,
            overflow: 'visible'
          }}
        >
          <svg 
            width={svgWidth} 
            height={height + 100} 
            ref={svgRef}
            style={{
              display: 'block',
              zIndex: 10
            }}
            onClick={(e) => {
              // SVG'nin doğrudan kendisine tıklandığında (node veya link dışında)
              if (e.target.tagName === 'svg') {
                setSelectedOrg(null);
                setSelectedLinks([]);
              }
            }}
          >
            <defs>
              {adjustedNodes.map(node => (
                <clipPath id={`clip-${node.id}`} key={`clip-${node.id}`}>
                  <circle r={nodeRadius * 0.8} cx="0" cy="0" />
                </clipPath>
              ))}
            </defs>
            
            {/* SVG içeriğinin render sırası:
                 1. Normal, seçili olmayan bağlantılar (en altta)
                 2. Highlight edilmiş bağlantılar (ortada)
                 3. Normal node'lar
                 4. Highlight edilmiş node'lar
                 5. Bağlantı etiketleri (en üstte)
            */}
            
            {/* Normal, seçili olmayan bağlantılar */}
            <g className="links-container-background">
              {links.map((link, i) => {
                const isInHover = hoveredOrg && hoveredLinks.some(l => l.source === link.source && l.target === link.target);
                const isSelected = selectedOrg && selectedLinks.some(l => l.source === link.source && l.target === link.target);
                
                // Sadece vurgulanmayan bağlantıları burada göster
                if (!isInHover && !isSelected) {
                  return (
                    <path
                      key={`link-bg-${i}`}
                      className="link-path"
                      d={`M${link.sourceX},${link.sourceY} C${link.sourceX},${(link.sourceY + link.targetY) / 2} ${link.targetX},${(link.sourceY + link.targetY) / 2} ${link.targetX},${link.targetY}`}
                      stroke={getLinkColor(link)}
                      strokeWidth={getLinkWidth(link)}
                      fill="none"
                      strokeDasharray={link.type === "ideological" ? "5,5" : "none"}
                      opacity={getLinkOpacity(link)}
                      style={{
                        transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s",
                      }}
                    />
                  );
                }
                return null;
              })}
            </g>
            
            {/* Highlight edilmiş bağlantılar - nodelardan ÖNCE */}
            <g className="links-container-foreground">
              {links.map((link, i) => {
                const isInHover = hoveredOrg && hoveredLinks.some(l => l.source === link.source && l.target === link.target);
                const isSelected = selectedOrg && selectedLinks.some(l => l.source === link.source && l.target === link.target);
                
                // Sadece vurgulanan bağlantıları burada göster
                if (isInHover || isSelected) {
                  return (
                    <path
                      key={`link-fg-${i}`}
                      className="link-path highlighted"
                      d={`M${link.sourceX},${link.sourceY} C${link.sourceX},${(link.sourceY + link.targetY) / 2} ${link.targetX},${(link.sourceY + link.targetY) / 2} ${link.targetX},${link.targetY}`}
                      stroke={getLinkColor(link)}
                      strokeWidth={getLinkWidth(link)}
                      fill="none"
                      strokeDasharray={link.type === "ideological" ? "5,5" : "none"}
                      opacity={getLinkOpacity(link)}
                      style={{
                        transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s",
                      }}
                    />
                  );
                }
                return null;
              })}
            </g>
            
            {/* Normal node'lar - Highlight edilmiş bağlantılarından sonra */}
            <g className="nodes-container-normal">
              {adjustedNodes.map(node => {
                const isNodeHovered = hoveredOrg === node.id;
                const isNodeSelected = selectedOrg === node.id;
                
                // Sadece vurgulanmayan node'ları burada göster
                if (!isNodeHovered && !isNodeSelected) {
                  return (
                  <g
                    key={`node-normal-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseEnter={() => handleNodeHover(node.id)}
                    onMouseLeave={() => handleNodeHover(null)}
                    onClick={() => handleNodeClick(node.id)}
                    style={{ 
                      cursor: 'pointer', 
                      opacity: getNodeOpacity(node),
                      transition: "opacity 0.3s",
                    }}
                  >
                    <circle
                      className="node-circle"
                      r={nodeRadius}
                      fill="#ffffff"
                      stroke={getNodeStrokeColor(node)}
                      strokeWidth={1.5}
                      style={{
                        transition: "stroke 0.3s, stroke-width 0.3s",
                      }}
                    />
                    
                    <image
                      href={node.logo}
                      x={-nodeRadius * 0.8}
                      y={-nodeRadius * 0.8}
                      width={nodeRadius * 1.6}
                      height={nodeRadius * 1.6}
                      clipPath={`url(#clip-${node.id})`}
                    />
                    
                    <text
                      className="node-label"
                      y={nodeRadius + 15}
                      textAnchor="middle"
                      stroke="#ffffff"
                      strokeWidth={4}
                      paintOrder="stroke"
                      fill="#999"
                      fontSize={12}
                      fontWeight="normal"
                      style={{ 
                        transition: "fill 0.3s, font-weight 0.3s",
                      }}
                    >
                      {node.shortName}
                    </text>
                    
                    <text
                      className="node-label"
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
                  </g>
                  );
                }
                return null;
              })}
            </g>
            
            {/* Highlight edilmiş node'lar - En son, bağlantıların üstünde */}
            <g className="nodes-container-highlighted">
              {adjustedNodes.map(node => {
                const isNodeHovered = hoveredOrg === node.id;
                const isNodeSelected = selectedOrg === node.id;
                
                // Sadece vurgulanmış node'ları burada göster
                if (isNodeHovered || isNodeSelected) {
                  return (
                  <g
                    key={`node-highlight-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseEnter={() => handleNodeHover(node.id)}
                    onMouseLeave={() => handleNodeHover(null)}
                    onClick={() => handleNodeClick(node.id)}
                    style={{ 
                      cursor: 'pointer', 
                      opacity: 1, // Vurgulanmış node'lar her zaman tam opasite
                      transition: "opacity 0.3s",
                    }}
                  >
                    <circle
                      className={`node-circle ${isNodeSelected ? 'selected' : ''}`}
                      r={nodeRadius}
                      fill="#ffffff"
                      stroke={getNodeStrokeColor(node)}
                      strokeWidth={2}
                      style={{
                        transition: "stroke 0.3s, stroke-width 0.3s",
                      }}
                    />
                    
                    <image
                      href={node.logo}
                      x={-nodeRadius * 0.8}
                      y={-nodeRadius * 0.8}
                      width={nodeRadius * 1.6}
                      height={nodeRadius * 1.6}
                      clipPath={`url(#clip-${node.id})`}
                    />
                    
                    <text
                      className="node-label"
                      y={nodeRadius + 15}
                      textAnchor="middle"
                      stroke="#ffffff"
                      strokeWidth={4}
                      paintOrder="stroke"
                      fill="#000"
                      fontSize={12}
                      fontWeight="normal"
                      style={{ 
                        transition: "fill 0.3s, font-weight 0.3s",
                      }}
                    >
                      {node.shortName}
                    </text>
                    
                    <text
                      className="node-label"
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
                  </g>
                  );
                }
                return null;
              })}
            </g>
            
            {/* Bağlantı Etiketleri - En son çizilecek, her şeyin üstünde */}
            <g className="link-labels-container" style={{ pointerEvents: "none" }}>
              {links.map((link, i) => {
                const isInHover = hoveredOrg && hoveredLinks.some(l => l.source === link.source && l.target === link.target);
                const isSelected = selectedOrg && selectedLinks.some(l => l.source === link.source && l.target === link.target);
                const midX = (link.sourceX + link.targetX) / 2;
                const midY = (link.sourceY + link.targetY) / 2;
                
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
                
                // Sadece hover veya seçili bağlantıların etiketlerini göster
                if (isInHover || isSelected) {
                  return (
                    <g
                      key={`link-label-${i}`}
                      className="link-label-group"
                    >
                      <text
                        x={midX}
                        y={midY}
                        textAnchor="middle"
                        fontSize={10}
                        dy="-0.5em"
                        fontWeight="bold"
                        stroke="#ffffff"
                        strokeWidth={4}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        fill={getLinkColor(link)}
                        paintOrder="stroke"
                      >
                        {linkLabel}
                      </text>
                    </g>
                  );
                }
                return null;
              })}
            </g>
            
            {/* Popup Bilgileri */}
            <g className="popups-container">
              {adjustedNodes.map(node => {
                const isNodeHovered = hoveredOrg === node.id;
                
                if ((isNodeHovered || selectedOrg === node.id) && partyDetails[node.id]) {
                  const popupWidth = 250;
                  const popupHeight = 170;
                  
                  let popupX = nodeRadius + 10;
                  let popupY = -nodeRadius - 80;
                  let arrowPath = `M${nodeRadius} 0 L${nodeRadius + 10} -10 L${nodeRadius + 10} 10 Z`;
                  
                  if (node.x + popupX + popupWidth > svgWidth) {
                    popupX = -nodeRadius - 10 - popupWidth;
                    arrowPath = `M${-nodeRadius} 0 L${-nodeRadius - 10} -10 L${-nodeRadius - 10} 10 Z`;
                  }
                  
                  return (
                    <g 
                      key={`popup-${node.id}`} 
                      transform={`translate(${node.x}, ${node.y})`}
                      className="popup-group" 
                      style={{ 
                        zIndex: 1000,
                        pointerEvents: "none" 
                      }}
                    >
                      <rect
                        x={popupX}
                        y={popupY}
                        width={popupWidth}
                        height={popupHeight}
                        rx={5}
                        fill="white"
                        stroke="#ccc"
                        strokeWidth={1}
                        filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.15))"
                        opacity={0}
                        style={{
                          animation: "fadeIn 0.2s forwards",
                        }}
                      />
                      
                      <path
                        d={arrowPath}
                        fill="white"
                        stroke="#ccc"
                        strokeWidth={1}
                        opacity={0}
                        style={{
                          animation: "fadeIn 0.2s forwards",
                        }}
                      />
                      
                      <text
                        x={popupX + 20}
                        y={popupY + 25}
                        fontWeight="bold"
                        fontSize={14}
                        fill="#333"
                        opacity={0}
                        style={{
                          animation: "slideIn 0.3s forwards",
                        }}
                      >
                        {partyDetails[node.id].fullName}
                      </text>
                      
                      {partyDetails[node.id].founders && (
                        <text
                          x={popupX + 20}
                          y={popupY + 45}
                          fontSize={12}
                          fill="#555"
                          opacity={0}
                          style={{
                            animation: "slideIn 0.3s forwards 0.05s",
                          }}
                        >
                          <tspan fontWeight="bold">Kurucular:</tspan> {partyDetails[node.id].founders}
                        </text>
                      )}
                      
                      <text
                        x={popupX + 20}
                        y={popupY + 65}
                        fontSize={12}
                        fill={
                          partyDetails[node.id].armed ? "#ff0000" : 
                          partyDetails[node.id].status === "Aktif" ? "#4CAF50" : "#999999"
                        }
                        opacity={0}
                        style={{
                          animation: "slideIn 0.3s forwards 0.1s",
                        }}
                      >
                        <tspan fontWeight="bold">Durum:</tspan> {partyDetails[node.id].status}
                        {partyDetails[node.id].armed && " (Silahlı)"}
                        {partyDetails[node.id].startYear && 
                          ` (${partyDetails[node.id].startYear}${partyDetails[node.id].endYear ? `-${partyDetails[node.id].endYear}` : ""})`}
                      </text>
                      
                      {partyDetails[node.id].website && partyDetails[node.id].website !== "" && (
                        <text
                          x={popupX + 20}
                          y={popupY + 85}
                          fontSize={12}
                          fill="#1976d2"
                          opacity={0}
                          style={{
                            animation: "slideIn 0.3s forwards 0.15s",
                          }}
                        >
                          <tspan fontWeight="bold">Web:</tspan> {partyDetails[node.id].website}
                        </text>
                      )}
                      
                      <foreignObject
                        x={popupX + 20}
                        y={popupY + 105}
                        width={popupWidth - 40}
                        height={60}
                        opacity={0}
                        style={{
                          animation: "slideIn 0.3s forwards 0.2s",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#555", fontFamily: "Arial", lineHeight: "1.3" }}>
                          {partyDetails[node.id].info}
                        </div>
                      </foreignObject>
                    </g>
                  );
                }
                return null;
              })}
            </g>
          </svg>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .full-width-container {
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw !important;
          margin-right: -50vw !important;
        }
        
        .timeline-container {
          position: relative;
          overflow: hidden !important;
          width: 100vw !important;
        }
        
        .node-circle {
          filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1));
          transition: stroke 0.4s ease-in-out, 
                      stroke-width 0.4s ease-in-out, 
                      opacity 0.4s ease-in-out,
                      transform 0.3s ease-out;
        }
        
        .node-circle:hover {
          transform: scale(1.05);
        }
        
        .node-circle.selected {
          stroke-width: 2px !important;
          filter: drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.3));
        }
        
        .link-group.active.selected path {
          stroke-width: 3px;
        }
        
        .link-path {
          transition: stroke 0.4s ease-in-out, 
                      stroke-width 0.4s ease-in-out, 
                      opacity 0.4s ease-in-out;
        }
        
        .popup-group {
          pointer-events: none;
        }
        
        /* Bağlantı etiketleri için stil */
        .link-labels-container {
          pointer-events: none;
        }
        
        .link-path.highlighted {
          stroke-width: 3px;
        }
        
        body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        svg {
          overflow: visible;
          width: 100vw !important;
        }
        
        /* Margin sorununu çözmek için ekstrem önlemler */
        html, body, #root, #__next {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative;
        }
        
        /* Tailwind container sınıfının özelliklerini geçersiz kıl */
        .container, div[class^="container"] {
          width: 100vw !important;
          max-width: 100vw !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
      `}</style>
    </div>
  );
}
