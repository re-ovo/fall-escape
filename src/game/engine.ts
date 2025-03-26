import * as PIXI from "pixi.js";
import Matter from "matter-js";
import { GameObject } from "./obj";

// 重力
const GRAVITY = 1;
// 物理世界的缩放比例（像素/米）
const SCALE = 3;
// 墙块大小（米）
const BLOCK_SIZE = 20;
// 小球半径（米）
const BALL_RADIUS = 5;
// 旋转速度（弧度/秒）
const ROTATION_SPEED = 2;

export class GameEngine {
  private readonly app: PIXI.Application;
  private readonly engine: Matter.Engine;
  private readonly world: Matter.World;
  private container: PIXI.Container;
  private centerX: number = 0;
  private centerY: number = 0;

  private gameObjects: GameObject<PIXI.Container>[] = [];
  private ball: GameObject<PIXI.Container> | null = null;
  private levelComplete: boolean = false;
  private currentLevel: number[][] | null = null;
  private onLevelComplete: (() => void) | null = null;
  private boundaryBody: Matter.Body | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;

    // 创建Matter.js引擎
    this.engine = Matter.Engine.create({
      gravity: { y: GRAVITY },
    });
    // 设置固定的时间步长
    this.engine.timing.timeScale = 0.8; // 略微减慢物理模拟速度以增加稳定性
    this.world = this.engine.world;

    // 创建容器来包含所有游戏对象
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // 设置容器的旋转中心
    this.container.pivot.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2
    );
    this.container.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2
    );
    this.centerX = this.app.screen.width / 2;
    this.centerY = this.app.screen.height / 2;

    // 添加键盘事件监听
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowLeft":
      case "a":
        this.rotateWorld(-1);
        break;
      case "ArrowRight":
      case "d":
        this.rotateWorld(1);
        break;
    }
  }

  private rotateWorld(direction: number) {
    this.container.rotation += direction * ROTATION_SPEED * 0.01;

    // 更新重力方向以匹配容器旋转
    const angle = this.container.rotation;
    
    // 重力方向应该与旋转方向相反（容器旋转时重力相对于容器的方向）
    const gravity = {
      x: Math.sin(angle) * GRAVITY,
      y: Math.cos(-angle) * GRAVITY,
    };
    
    this.engine.gravity.x = gravity.x;
    this.engine.gravity.y = gravity.y;
  }

  loadLevel(level: number[][]) {
    // 清除现有的游戏对象
    this.clearLevel();

    this.currentLevel = level;
    const levelHeight = level.length;
    const levelWidth = level[0].length;

    // 遍历关卡数据创建墙壁和球
    for (let y = 0; y < levelHeight; y++) {
      for (let x = 0; x < levelWidth; x++) {
        const cell = level[y][x];

        // 计算物体位置，转换为物理世界坐标
        const posX = (x + 0.5 - levelWidth / 2) * BLOCK_SIZE;
        const posY = (y + 0.5 - levelHeight / 2) * BLOCK_SIZE;

        if (cell === 1) {
          // 创建墙壁
          this.createWall(posX, posY);
        } else if (cell === -1) {
          // 创建球
          this.createBall(posX, posY);
        }
      }
    }

    // 创建边界检测区域（在关卡外围）
    this.createBoundary(levelWidth, levelHeight);

    this.levelComplete = false;
    this.container.rotation = 0;
  }

  private physicsToPixi(x: number, y: number) {
    const pixiX = this.centerX + x * SCALE;
    const pixiY = this.centerY + y * SCALE;
    return {
      x: pixiX,
      y: pixiY,
    };
  }

  private createWall(x: number, y: number) {
    // 创建墙壁精灵
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x888888);
    graphics.drawRect(
      (-BLOCK_SIZE / 2) * SCALE,
      (-BLOCK_SIZE / 2) * SCALE,
      BLOCK_SIZE * SCALE,
      BLOCK_SIZE * SCALE
    );
    graphics.endFill();

    const wall = new GameObject(graphics);
    this.container.addChild(wall.getElement());

    const pixiPos = this.physicsToPixi(x, y);

    wall.getElement().x = pixiPos.x;
    wall.getElement().y = pixiPos.y;

    // 创建Matter.js静态方块
    const body = Matter.Bodies.rectangle(x, y, BLOCK_SIZE, BLOCK_SIZE, {
      isStatic: true,
      restitution: 0.8,
      chamfer: { radius: 0.01 }, // 添加轻微的边角柔化
    });

    Matter.Composite.add(this.world, body);
    wall.setBody(body);

    this.gameObjects.push(wall);
  }

  private createBall(x: number, y: number) {
    // 创建球体精灵
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xff0000);
    graphics.drawCircle(0, 0, BALL_RADIUS * SCALE);
    graphics.endFill();

    const ball = new GameObject(graphics);
    this.container.addChild(ball.getElement());

    const pixiPos = this.physicsToPixi(x, y);

    // 设置初始位置（pixi坐标）
    ball.getElement().x = pixiPos.x;
    ball.getElement().y = pixiPos.y;

    // 创建Matter.js圆形刚体
    const body = Matter.Bodies.circle(x, y, BALL_RADIUS, {
      friction: 0,
      frictionAir: 0,
      restitution: 0.8,
      mass: 0.01,
    });

    Matter.Composite.add(this.world, body);
    ball.setBody(body);

    this.ball = ball;
    this.gameObjects.push(ball);
  }

  private createBoundary(width: number, height: number) {
    // 创建边界传感器，检测小球是否离开迷宫
    const boundarySize = Math.max(width, height) * BLOCK_SIZE * 2;

    // 创建一个大型传感器，用于检测小球是否离开迷宫
    this.boundaryBody = Matter.Bodies.rectangle(
      0,
      boundarySize,
      boundarySize * 2,
      1,
      {
        isSensor: true,
        isStatic: true,
        label: "boundary",
      }
    );

    Matter.Composite.add(this.world, this.boundaryBody);

    // 添加碰撞检测事件
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        // 如果球与边界碰撞
        if (
          this.ball &&
          this.ball.getBody() &&
          ((pair.bodyA === this.ball.getBody() &&
            pair.bodyB.label === "boundary") ||
            (pair.bodyB === this.ball.getBody() &&
              pair.bodyA.label === "boundary"))
        ) {
          const ballPos = this.ball.getBody()?.position;
          if (ballPos) {
            // 判断小球是否离开关卡边界
            const levelWidth = this.currentLevel?.[0].length || 0;
            const levelHeight = this.currentLevel?.length || 0;
            const maxSize = Math.max(levelWidth, levelHeight) * BLOCK_SIZE;

            // 如果小球距离中心超过一定距离，则认为完成关卡
            const distanceFromCenter = Math.sqrt(
              ballPos.x * ballPos.x + ballPos.y * ballPos.y
            );
            if (distanceFromCenter > maxSize && this.levelComplete === false) {
              this.levelComplete = true;
              if (this.onLevelComplete) {
                this.onLevelComplete();
              }
            }
          }
        }
      }
    });
  }

  private clearLevel() {
    // 清除所有游戏对象
    for (const obj of this.gameObjects) {
      const body = obj.getBody();

      if (body) {
        Matter.Composite.remove(this.world, body);
      }

      this.container.removeChild(obj.getElement());
    }

    // 移除边界
    if (this.boundaryBody) {
      Matter.Composite.remove(this.world, this.boundaryBody);
      this.boundaryBody = null;
    }

    this.gameObjects = [];
    this.ball = null;
    
  }

  run = () => {
    if (this.levelComplete) {
      return;
    }

    // 使用固定的时间步长更新物理世界
    const deltaTime = this.app.ticker.deltaMS / 1000; // 转换为秒
    Matter.Engine.update(this.engine, deltaTime * 1000);

    // 更新所有游戏对象位置
    for (const obj of this.gameObjects) {
      const body = obj.getBody();
      if (body) {
        const pos = body.position;

        // 物理坐标转换为屏幕坐标（考虑到中心点偏移）
        const pixiPos = this.physicsToPixi(pos.x, pos.y);
        obj.getElement().x = pixiPos.x;
        obj.getElement().y = pixiPos.y;

        // 更新旋转
        obj.getElement().rotation = body.angle;
      }
    }
  };

  start() {
    this.app.ticker.add(this.run);
  }

  stop() {
    this.app.ticker.remove(this.run);
  }

  setOnLevelComplete(callback: () => void) {
    this.onLevelComplete = callback;
  }

  isLevelComplete(): boolean {
    return this.levelComplete;
  }
}
