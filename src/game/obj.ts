import * as PIXI from "pixi.js";
import Matter from "matter-js";

export class GameObject<T extends PIXI.Container> {
  protected element: T;

  private body: Matter.Body | null = null;

  constructor(element: T) {
    this.element = element;
  }

  update(): void {}

  getElement(): T {
    return this.element;
  }

  setBody(body: Matter.Body): void {
    this.body = body;
  }

  getBody(): Matter.Body | null {
    return this.body;
  }

  setPosition(position: Matter.Vector): void {
    if (this.body) {
      Matter.Body.setPosition(this.body, position);
    }
  }

  setRotation(rotation: number): void {
    if (this.body) {
      Matter.Body.setAngle(this.body, rotation);
    }
  }
}

export class SpriteObject extends GameObject<PIXI.Sprite> {
  constructor(sprite: PIXI.Sprite) {
    super(sprite);
  }
}
