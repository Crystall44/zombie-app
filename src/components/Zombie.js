//Класс Зомби
export class Zombie {
    constructor(x, y, speed = 0.9, infectionRadius = 20, detectionRadius = 150, maxHealth = 5, attackPower = 1, attackRate = 60){
        this.x = x || Math.random() * 700 + 50;
        this.y = y || Math.random() * 500 + 50;
        this.radius = 7;
        this.direction = Math.random() * Math.PI * 2;
        this.speed = speed;
        this.detectionRadius = detectionRadius;
        this.infectionRadius = infectionRadius;
        this.color = 'hsl(0, 100%, 30%)';
        this.currentTarget = null;
        this.targetLockTimer = 0;
        this.idleTimer = 0;
        this.idleDuration = 120;
        this.isIdle = false;
        this.walkCucle = 0;
        this.walkangle = 0;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.attackPower = attackPower;
        this.attackCooldown = 0;
        this.attackRate = attackRate;
    }

    move(humans, medics, guardians) {
        if(this.currentTarget && this.targetLockTimer > 0 && this.currentTarget.infectionProgress === 0) {
            this.targetLockTimer--;
            const dist = Math.hypot(this.x-this.currentTarget.x, this.y-this.currentTarget.y);
            
            const isTargetValid = (this.currentTarget.infectionProgress === 0 || this.currentTarget.health > 0) && dist < this.detectionRadius;

            if(isTargetValid) {
                if(this.currentTarget.health !== undefined && dist < this.infectionRadius) {
                    this.attack(this.currentTarget);
                }
                else if (this.currentTarget.infectionProgress !== undefined) {
                    this.chase(this.currentTarget);
                }
                return;
            }
        }
        const allHumans = [...humans.filter(h => h.infectionProgress === 0), ...medics.filter(m => m.infectionProgress === 0), ...guardians.filter(g => g.health > 0)];
        const closestHuman = this.findClosestHuman(allHumans);

        if (closestHuman && this.isHumanNear(closestHuman)) {
            this.currentTarget = closestHuman;
            this.targetLockTimer = 100;
            if(closestHuman.health !== undefined && this.distanceTo(closestHuman) < this.infectionRadius) {
                this.attack(closestHuman);
            } else {
                this.chase(closestHuman);
            }
        } else {
            //Случайное блуждание
            this.randomWalk()
            this.currentTarget = null;
        }

        if(this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    isHumanNear(human) {
        return Math.hypot(this.x - human.x, this.y - human.y) < this.detectionRadius;
    }

    chase(human){
        const prediction = 10;
        const humanFutureX = human.x + Math.cos(human.direction) * prediction;
        const humanFutureY = human.y + Math.sin(human.direction) * prediction;

        this.direction = Math.atan2(humanFutureY - this.y, humanFutureX-this.x);

        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        this.applyBoundaries();
    }

    attack(target) {
        if(this.attackCooldown <= 0 && target.health !== undefined) {
            target.health -= this.attackPower;
            this.attackCooldown = this.attackRate;

            if(target.health <= 0) {
                this.currentTarget = null;
            }
        }
    }

    randomWalk(){
        if(this.walkCucle <= 0) {
            this.walkangle = Math.random() * Math.PI * 2;
            this.walkCucle = 50 + Math.random() * 50;
        }

        this.walkCucle--;
        const angleDiff = this.walkangle - this.direction;
        this.direction += angleDiff * 0.05;

        const currentSpeed = this.speed * (0.3 + Math.random() * 0.2);
        this.x += Math.cos(this.direction) * currentSpeed;
        this.y += Math.sin(this.direction) * currentSpeed;

        if(this.x <= 10 || this.x >= 790) {
            this.walkangle = Math.PI - this.direction;
            this.walkCucle = 30;
        }
        if (this.y <= 10 || this.y >= 590) {
            this.walkangle = -this.direction;
            this.walkCucle = 30;
        }

        this.applyBoundaries();
    }

    applyBoundaries() {
        this.x = Math.max(10, Math.min(790, this.x));
        this.y = Math.max(10, Math.min(590, this.y));
    }

    findClosestHuman(humans) {
        if(humans.length === 0) return null;

        return humans.reduce((closest, human) => {
            const dist = Math.hypot(this.x - human.x, this.y - human.y)
            return dist < closest.dist ? { human, dist } : closest
          }, { human: null, dist: Infinity }).human;
    }

    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
    }
}