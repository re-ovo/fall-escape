import React, { useState } from 'react';

interface LevelEditorProps {
  onSave: (level: number[][]) => void;
  onCancel: () => void;
  initialLevel?: number[][];
}

// 单元格类型映射
const cellTypes = {
  '-1': '球',
  '0': '空',
  '1': '墙'
};

const LevelEditor: React.FC<LevelEditorProps> = ({ onSave, onCancel, initialLevel }) => {
  const [gridSize, setGridSize] = useState({
    width: initialLevel?.[0].length || 6,
    height: initialLevel?.length || 6
  });
  
  const [grid, setGrid] = useState<number[][]>(
    initialLevel || 
    Array(gridSize.height).fill(0).map(() => 
      Array(gridSize.width).fill(0)
    )
  );
  
  const [currentCellType, setCurrentCellType] = useState<number>(0);
  
  const handleCellClick = (row: number, col: number) => {
    const newGrid = [...grid];
    
    // 如果当前要放置的是球，先清除所有其他的球
    if (currentCellType === -1) {
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c] === -1) {
            newGrid[r][c] = 0;
          }
        }
      }
    }
    
    newGrid[row][col] = currentCellType;
    setGrid(newGrid);
  };
  
  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    const newSize = { ...gridSize, [dimension]: value };
    setGridSize(newSize);
    
    // 调整网格大小
    const newGrid = Array(newSize.height).fill(0).map((_, rowIndex) => 
      Array(newSize.width).fill(0).map((_, colIndex) => {
        // 保留原有网格中存在的值
        if (rowIndex < grid.length && colIndex < grid[0].length) {
          return grid[rowIndex][colIndex];
        }
        return 0;
      })
    );
    
    setGrid(newGrid);
  };
  
  const validateLevel = (): boolean => {
    // 检查是否有起始位置（球）
    let hasBall = false;
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === -1) {
          hasBall = true;
        }
      }
    }
    
    return hasBall;
  };
  
  const handleSaveClick = () => {
    if (validateLevel()) {
      onSave(grid);
    } else {
      alert('关卡必须有一个起始位置（球）');
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '80%',
        maxHeight: '80%',
        overflow: 'auto'
      }}>
        <h2>关卡编辑器</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label>宽度: </label>
          <input 
            type="number" 
            min="3" 
            max="20" 
            value={gridSize.width} 
            onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 3)}
            style={{ marginRight: '10px' }}
          />
          
          <label>高度: </label>
          <input 
            type="number"
            min="3" 
            max="20" 
            value={gridSize.height} 
            onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 3)}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div>选择单元格类型:</div>
          {Object.entries(cellTypes).map(([type, label]) => (
            <button 
              key={type}
              onClick={() => setCurrentCellType(parseInt(type))}
              style={{ 
                margin: '5px',
                padding: '8px 12px',
                backgroundColor: currentCellType === parseInt(type) ? '#4CAF50' : '#e0e0e0',
                color: currentCellType === parseInt(type) ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {grid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td 
                      key={colIndex}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      style={{
                        width: '30px',
                        height: '30px',
                        border: '1px solid #ccc',
                        backgroundColor: 
                          cell === -1 ? '#ff6b6b' :
                          cell === 1 ? '#aaaaaa' : 
                          '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {cell === -1 ? '🔴' : cell === 1 ? '⬛' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div>
          <button 
            onClick={handleSaveClick}
            style={{ 
              marginRight: '10px',
              padding: '10px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            保存关卡
          </button>
          
          <button 
            onClick={onCancel}
            style={{ 
              padding: '10px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelEditor; 