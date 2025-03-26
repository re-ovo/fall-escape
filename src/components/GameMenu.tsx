import React from 'react';

interface GameMenuProps {
  currentLevel: number;
  totalLevels: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  onStart: () => void;
  onRestart: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({
  currentLevel,
  totalLevels,
  gameStarted,
  gameCompleted,
  onStart,
  onRestart
}) => {
  return (
    <>
      <div
        style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#222',
          color: '#fff'
        }}
      >
        {gameStarted ? (
          <h2>第 {currentLevel + 1}/{totalLevels} 关 {gameCompleted ? '- 游戏完成!' : ''}</h2>
        ) : (
          <h2>迷宫逃脱</h2>
        )}
        <p>使用方向键或A/D键控制旋转，让小球落出迷宫</p>
      </div>
      
      {(!gameStarted || gameCompleted) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center'
          }}
        >
          {gameCompleted && (
            <div style={{ color: '#fff', marginBottom: '20px' }}>
              <h2>🎉 恭喜完成所有关卡! 🎉</h2>
              <p>你成功让小球逃出了所有迷宫!</p>
            </div>
          )}
          
          {!gameStarted ? (
            <button
              onClick={onStart}
              style={{
                padding: '15px 30px',
                fontSize: '24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              开始游戏
            </button>
          ) : gameCompleted ? (
            <button
              onClick={onRestart}
              style={{
                padding: '15px 30px',
                fontSize: '24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              重新开始
            </button>
          ) : null}
        </div>
      )}
    </>
  );
};

export default GameMenu; 