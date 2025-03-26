import * as PIXI from 'pixi.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { ALL_LEVELS } from './game/levels';
import LevelEditor from './components/LevelEditor';
import { useCustomLevels } from './hooks/useCustomLevels';
import Confetti from 'react-confetti';

function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [editingLevel, setEditingLevel] = useState<number[][] | undefined>(undefined);
  const [editingLevelIndex, setEditingLevelIndex] = useState<number | undefined>(undefined);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isMuted, setIsMuted] = useState(true);
  
  // 获取自定义关卡
  const { 
    customLevels, 
    addCustomLevel, 
    updateCustomLevel, 
    deleteCustomLevel 
  } = useCustomLevels();
  
  // 所有关卡（内置 + 自定义）
  const allLevels = useMemo(() => [...ALL_LEVELS, ...customLevels], [customLevels]);

  // 添加窗口大小监听
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    (async () => {
      appRef.current = new PIXI.Application();
      await appRef.current.init({
        background: '#1a1a1a',
        resizeTo: gameContainerRef.current!,
        antialias: true,
      });
      gameContainerRef.current!.appendChild(appRef.current.canvas);
      engineRef.current = new GameEngine(appRef.current);
    })();

    // Cleanup on unmount
    return () => {
      appRef.current?.destroy(true);
    };
  }, []);

  // 添加音频控制
  useEffect(() => {
    audioRef.current = new Audio('/relaxing-guitar-loop.mp3');
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 设置关卡完成回调，确保使用最新的state值
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setOnLevelComplete(() => {
        console.log("当前关卡:", currentLevel, "总关卡:", allLevels.length);
        if (currentLevel < allLevels.length - 1) {
          setCurrentLevel(prev => {
            console.log("setCurrentLevel", prev + 1);
            return prev + 1;
          });
        } else {
          console.log("关卡完成!");
          setGameCompleted(true);
          engineRef.current?.stop();
        }
      });
    }
  }, [currentLevel, allLevels, engineRef]);

  // 监听currentLevel变化，加载新关卡
  useEffect(() => {
    if (engineRef.current && gameStarted && !gameCompleted && currentLevel < allLevels.length) {
      engineRef.current.loadLevel(allLevels[currentLevel]);
    }
  }, [currentLevel, gameStarted, gameCompleted, allLevels]);

  const startGame = () => {
    if (engineRef.current && currentLevel < allLevels.length) {
      engineRef.current.loadLevel(allLevels[currentLevel]);
      engineRef.current.start();
      setGameStarted(true);
      setShowLevelSelect(false);
      // 开始游戏时自动播放音乐
      if (audioRef.current) {
        audioRef.current.play();
        setIsMuted(false);
      }
    }
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setGameCompleted(false);
    if (engineRef.current) {
      engineRef.current.loadLevel(allLevels[0]);
      engineRef.current.start();
    }
    setGameStarted(true);
    // 重新开始游戏时也自动播放音乐
    if (audioRef.current) {
      audioRef.current.play();
      setIsMuted(false);
    }
  };
  
  const handleOpenEditor = (level?: number[][], index?: number) => {
    setEditingLevel(level);
    setEditingLevelIndex(index);
    setShowEditor(true);
  };
  
  const handleEditorSave = (level: number[][]) => {
    if (editingLevelIndex !== undefined) {
      // 更新现有关卡
      updateCustomLevel(editingLevelIndex - ALL_LEVELS.length, level);
    } else {
      // 添加新关卡
      addCustomLevel(level);
    }
    
    setShowEditor(false);
    setEditingLevel(undefined);
    setEditingLevelIndex(undefined);
  };
  
  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditingLevel(undefined);
    setEditingLevelIndex(undefined);
  };
  
  const handleDeleteLevel = (index: number) => {
    if (index >= ALL_LEVELS.length) {
      const customIndex = index - ALL_LEVELS.length;
      if (confirm('确定要删除这个关卡吗？')) {
        deleteCustomLevel(customIndex);
      }
    }
  };
  
  const handleLevelSelect = (index: number) => {
    setCurrentLevel(index);
    setGameCompleted(false);
    setShowLevelSelect(false);
    
    if (gameStarted) {
      if (engineRef.current) {
        engineRef.current.loadLevel(allLevels[index]);
      }
    } else {
      startGame();
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {gameCompleted && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          backgroundColor: '#222',
          color: '#fff'
        }}
      >
        <h2>迷宫逃脱</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleAudio}
            style={{
              padding: '8px 15px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isMuted ? '🔇 开启音乐' : '🔊 关闭音乐'}
          </button>
          
          {gameStarted && (
            <>
              <button
                onClick={() => setShowLevelSelect(true)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                选择关卡
              </button>
              
              <button
                onClick={() => handleOpenEditor()}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                创建关卡
              </button>
            </>
          )}
        </div>
      </div>
      
      {gameStarted && (
        <div
          style={{
            textAlign: 'center',
            padding: '5px',
            backgroundColor: '#333',
            color: '#fff'
          }}
        >
          <p>第 {currentLevel + 1}/{allLevels.length} 关 {gameCompleted ? '- 游戏完成!' : ''}</p>
          <p>使用方向键或A/D键控制旋转，让小球落出迷宫</p>
        </div>
      )}
      
      <div 
        ref={gameContainerRef} 
        style={{ 
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      />
      
      {!gameStarted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            color: 'white'
          }}
        >
          <h1>迷宫逃脱</h1>
          <p>通过旋转迷宫控制重力方向，让小球逃离迷宫！</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={startGame}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              开始游戏
            </button>
            
            <button
              onClick={() => setShowLevelSelect(true)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              选择关卡
            </button>
            
            <button
              onClick={() => handleOpenEditor()}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              创建关卡
            </button>
          </div>
        </div>
      )}
      
      {gameCompleted && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            color: 'white'
          }}
        >
          <h1>🎉 恭喜完成所有关卡! 🎉</h1>
          <p>你成功让小球逃出了所有迷宫!</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              重新开始
            </button>
            
            <button
              onClick={() => handleOpenEditor()}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              创建关卡
            </button>
          </div>
        </div>
      )}
      
      {showEditor && (
        <LevelEditor
          initialLevel={editingLevel}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
      
      {showLevelSelect && (
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
            <h2>选择关卡</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {allLevels.map((level, index) => (
                <div 
                  key={index}
                  style={{
                    backgroundColor: index === currentLevel ? '#e0f7fa' : '#f5f5f5',
                    border: index === currentLevel ? '2px solid #00bcd4' : '1px solid #ddd',
                    borderRadius: '5px',
                    padding: '10px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                    关卡 {index + 1}
                  </div>
                  
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(level[0].length, 8)}, 1fr)`,
                    gap: '2px',
                    marginBottom: '10px'
                  }}>
                    {level.slice(0, 8).map((row, rowIndex) => (
                      row.slice(0, 8).map((cell, cellIndex) => (
                        <div 
                          key={`${rowIndex}-${cellIndex}`}
                          style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: 
                              cell === -1 ? '#ff6b6b' :
                              cell === 1 ? '#aaaaaa' : 
                              '#ffffff',
                            border: '1px solid #ccc'
                          }}
                        />
                      ))
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    <button
                      onClick={() => handleLevelSelect(index)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      开始
                    </button>
                    
                    {index >= ALL_LEVELS.length && (
                      <>
                        <button
                          onClick={() => handleOpenEditor(level, index)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          编辑
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLevel(index)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              <div 
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px dashed #aaa',
                  borderRadius: '5px',
                  padding: '10px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenEditor()}
              >
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>+</div>
                <div>新建关卡</div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => setShowLevelSelect(false)}
                style={{ 
                  padding: '10px 15px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
