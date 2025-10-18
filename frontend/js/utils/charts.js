/**
 * 📊 Charts Utility - Match Property
 * Gráficos de torta y barras sin librerías externas
 */

class Charts {
  /**
   * 🥧 Generar gráfico de torta (Pie Chart)
   */
  static generatePieChart(data, options = {}) {
    const {
      title = '',
      colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'],
      showLegend = true,
      size = 300
    } = options;

    // Calcular total
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
      return `<div class="empty-chart">No hay datos para mostrar</div>`;
    }

    // Generar SVG
    let currentAngle = -90; // Empezar desde arriba
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 10;

    const slices = Object.entries(data).map(([label, value], index) => {
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;
      const endAngle = currentAngle + angle;

      // Calcular coordenadas del arco
      const startX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
      const startY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
      const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const color = colors[index % colors.length];

      const path = `
        M ${centerX} ${centerY}
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `;

      currentAngle = endAngle;

      return {
        path,
        color,
        label,
        value,
        percentage: percentage.toFixed(1)
      };
    });

    return `
      <div class="pie-chart-container">
        ${title ? `<h4 class="chart-title">${title}</h4>` : ''}
        <div class="pie-chart-wrapper">
          <svg viewBox="0 0 ${size} ${size}" class="pie-chart" style="max-width: ${size}px;">
            ${slices.map(slice => `
              <path d="${slice.path}" 
                    fill="${slice.color}" 
                    class="pie-slice"
                    data-label="${slice.label}"
                    data-value="${slice.value}"
                    data-percentage="${slice.percentage}">
                <title>${slice.label}: ${slice.value} (${slice.percentage}%)</title>
              </path>
            `).join('')}
            
            <!-- Centro blanco para efecto donut -->
            <circle cx="${centerX}" cy="${centerY}" r="${radius * 0.5}" fill="white"/>
            
            <!-- Total en el centro -->
            <text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-size="24" font-weight="bold" fill="#333">
              ${total}
            </text>
            <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-size="12" fill="#666">
              Total
            </text>
          </svg>
          
          ${showLegend ? `
            <div class="chart-legend">
              ${slices.map(slice => `
                <div class="legend-item">
                  <span class="legend-color" style="background: ${slice.color}"></span>
                  <span class="legend-label">${slice.label}</span>
                  <span class="legend-value">${slice.value} (${slice.percentage}%)</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * 📊 Generar gráfico de barras verticales
   */
  static generateVerticalBarChart(data, options = {}) {
    const {
      title = '',
      colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'],
      showValues = true,
      height = 300
    } = options;

    const maxValue = Math.max(...Object.values(data));
    
    if (maxValue === 0) {
      return `<div class="empty-chart">No hay datos para mostrar</div>`;
    }

    const entries = Object.entries(data);
    const barWidth = Math.min(80, 100 / entries.length);

    return `
      <div class="bar-chart-container">
        ${title ? `<h4 class="chart-title">${title}</h4>` : ''}
        <div class="bar-chart-wrapper" style="height: ${height}px;">
          <div class="bar-chart">
            ${entries.map(([label, value], index) => {
              const percentage = (value / maxValue) * 100;
              const color = colors[index % colors.length];
              
              return `
                <div class="bar-column" style="flex: 1;">
                  ${showValues ? `
                    <div class="bar-value" style="color: ${color}; font-weight: 700; font-size: 1.2rem; margin-bottom: 8px;">
                      ${value}
                    </div>
                  ` : ''}
                  <div class="bar-wrapper" style="height: ${height - 80}px;">
                    <div class="bar" 
                         style="height: ${percentage}%; background: linear-gradient(to top, ${color}, ${color}dd); box-shadow: 0 4px 12px ${color}40;"
                         title="${label}: ${value}">
                    </div>
                  </div>
                  <div class="bar-label">${label}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 📈 Generar gráfico de barras horizontales (mejorado)
   */
  static generateHorizontalBarChart(data, options = {}) {
    const {
      title = '',
      colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'],
      showPercentage = true
    } = options;

    const maxValue = Math.max(...Object.values(data));
    
    if (maxValue === 0) {
      return `<div class="empty-chart">No hay datos para mostrar</div>`;
    }

    return `
      <div class="horizontal-bar-chart-container">
        ${title ? `<h4 class="chart-title">${title}</h4>` : ''}
        <div class="horizontal-bars">
          ${Object.entries(data).map(([label, value], index) => {
            const percentage = (value / maxValue) * 100;
            const color = colors[index % colors.length];
            
            return `
              <div class="h-bar-row">
                <div class="h-bar-label">${label}</div>
                <div class="h-bar-container">
                  <div class="h-bar" 
                       style="width: ${percentage}%; background: linear-gradient(90deg, ${color}, ${color}dd); box-shadow: 0 2px 8px ${color}30;">
                  </div>
                </div>
                <div class="h-bar-value" style="color: ${color};">${value}${showPercentage ? ` (${percentage.toFixed(0)}%)` : ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 🎨 Generar grid de KPIs
   */
  static generateKPIGrid(kpis) {
    return `
      <div class="kpis-grid">
        ${kpis.map(kpi => `
          <div class="kpi-card" style="background: ${kpi.gradient || 'linear-gradient(135deg, #0066CC, #0052a3)'};">
            <div class="kpi-icon">${kpi.icon}</div>
            <div class="kpi-value">${kpi.value}</div>
            <div class="kpi-label">${kpi.label}</div>
            ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Exportar globalmente
window.Charts = Charts;
