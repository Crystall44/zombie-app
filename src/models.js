//Класс Человека
export class Human {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 1;
        this.infected = false;
        this.color = 'hsl(240, 100%, 50%)';//Синий
        this.detectionRadius = 100;
        this.panicMode = false;
        this.infectionProgress = 0;
        this.infectionTime = 2000;
        this.direction = Math.random() * Math.PI * 2;
        this.panicTimer = 0;
        this.lastThreatPos = null;
    }

    //Движение
    move(zombies) {
        //Если уже заражён - просто бродит
        if(this.infectionProgress > 0) {
            this.randomWalk()
            return
        }

        //Поиск ближайшего зомби
        const closestZombie = this.findClosestZombie(zombies)

        if(closestZombie && this.isZombieNear(closestZombie)) {
            //Убегает от зомби
            this.runFrom(closestZombie)
            this.panicMode = true
        } else {
            if (this.panicTimer > 0) {
                this.panicTimer--;
                this.x += Math.cos(this.direction) * this.speed;
                this.y += Math.sin(this.direction) * this.speed;
                this.applyBoundaries();
                return;
            }
            //Случайное блуждание
            this.randomWalk()
            this.panicMode = false
        }
    }

    isZombieNear(zombie) {
        return Math.hypot(this.x - zombie.x, this.y - zombie.y) < this.detectionRadius
    }

    isNearWall() {
        const wallDist = 20;
        const xNearLeft = this.x <= 10 + wallDist;
        const xNearRight = this.x >= 790 - wallDist;
        const yNearTop = this.y <= 10 + wallDist;
        const yNearBottom = this.y >= 590 - wallDist;

        return{
            isNear: xNearLeft || xNearRight || yNearTop || yNearBottom
        };
    }

    runFrom(zombie) {
        const angle = Math.atan2(this.y - zombie.y, this.x - zombie.x);
        const wallInfo = this.isNearWall();

        if(wallInfo.isNear) {
            //Варианты движений вдоль стен
            const escapeOptions = [];

            //Если рядом левая стена
            if (wallInfo.nearLeft) {
                escapeOptions.push(
                    {angle:Math.PI/2, safe:Math.cos(Math.PI/2 - angle)},//Вниз
                    {angle:-Math.PI/2, safe:Math.cos(-Math.PI/2 - angle)}//Вверх
                );
            }

            if(wallInfo.nearRight) {
                escapeOptions.push(
                    {angle:Math.PI/2, safe:Math.cos(Math.PI/2 - angle)},
                    {angle:-Math.PI/2, safe:Math.cos(-Math.PI/2 - angle)}
                );
            }

            if(wallInfo.nearTop) {
                escapeOptions.push(
                    {angle:0, safe:Math.cos(0 - angle)},
                    {angle:Math.PI, safe:Math.cos(Math.PI - angle)}
                );
            }

            if(wallInfo.nearBottom) {
                escapeOptions.push(
                    {angle:0, safe:Math.cos(0 - angle)},
                    {angle:Math.PI, safe:Math.cos(Math.PI - angle)}
                );
            }

            if (escapeOptions.length > 0) {
                escapeOptions.sort((a, b) => b.safe - a.safe);
                this.direction = escapeOptions[0].angle ;
            } else {
                this.direction = angle + (Math.random() - 0.5) * (Math.PI/3);
            }
        } else {
            this.direction = angle + (Math.random() - 0.5) * (Math.PI/3);
        }

        this.avoidWalls();

        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        this.applyBoundaries();

        this.lastThreatPos = {x: zombie.x, y:zombie.y};
        this.panicTimer = 60;
    }

    randomWalk() {
        // 0.5% шанс изменить направление в случайную сторону
        if(Math.random() < 0.005 || !this.direction) {
            this.direction = Math.random() * Math.PI * 2
        }

        this.direction += (Math.random() - 0.5) * 0.15;

        this.x += Math.cos(this.direction) * this.speed
        this.y += Math.sin(this.direction) * this.speed

        const margin = 5;
        if (this.x <= margin) {
            this.x = margin;
            this.direction = Math.atan2(Math.sin(this.direction), -Math.cos(this.direction));
        }
        else if (this.x >= 800 - margin) {
            this.x = 800 - margin;
            this.direction = Math.atan2(Math.sin(this.direction), -Math.cos(this.direction));
        }
  
        if (this.y <= margin) {
            this.y = margin;
            this.direction = Math.atan2(-Math.sin(this.direction), Math.cos(this.direction));
        }
        else if (this.y >= 600 - margin) {
            this.y = 600 - margin;
            this.direction = Math.atan2(-Math.sin(this.direction), Math.cos(this.direction));
        }
    }

    applyBoundaries() {
        this.x = Math.max(10, Math.min(790, this.x))
        this.y = Math.max(10, Math.min(590, this.y))
    }

    avoidWalls() {
        const margin = 20;
        const nextX = this.x + Math.cos(this.direction) * margin;
        const nextY = this.y + Math.sin(this.direction) * margin;

        if(nextX < 10 || nextX > 790) {
            this.direction = nextY < this.y ? -Math.PI/2 : Math.PI/2;
        }
        else if (nextY < 10 || nextY > 590) {
            this.direction = nextX < this.x ? Math.PI : 0;
        }
    }

    findClosestZombie(zombies) {
        if(zombies.length === 0) return null

        return zombies.reduce((closest, zombie) => {
            const dist = Math.hypot(this.x - zombie.x, this.y - zombie.y)
            return dist < closest.dist ? {zombie, dist} : closest
        }, {zombie: null, dist: Infinity}).zombie
    }

    updateInfection(deltaTime){
        if(this.infectionProgress > 0){
            this.infectionProgress += deltaTime / this.infectionTime * 100 //Доработать!!!
            this.color = `hsl(${240 - (120 * this.infectionProgress/100)}, 100%, 50%)`
        }
    }

    isTooClose(x, y, minDist) {
        return Math.hypot(this.x - x, this.y - y) < minDist;
    }
}

//Класс Зомби
export class Zombie {
    constructor(x, y){
        this.x = x || Math.random() * 700 + 50
        this.y = y || Math.random() * 500 + 50
        this.radius = 8
        this.speed = 0.9
        this.detectionRadius = 150
        this.infectionRadius = 20
        this.color = 'hsl(120, 100%, 50%)'//Зелёный
        this.currentTarget = null;
        this.targetLockTimer = 0;
        this.idleTimer = 0;
        this.idleDuration = 120;
        this.isIdle = false;
        this.walkCucle = 0;
        this.walkangle = 0;
    }

    move(humans) {
        if(this.currentTarget && this.targetLockTimer > 0) {
            this.targetLockTimer--;
            const dist = Math.hypot(this.x-this.currentTarget.x, this.y-this.currentTarget.y);
            if(dist < this.detectionRadius * 1.5) {
                this.chase(this.currentTarget);
                return;
            }
        }

        const closestHuman = this.findClosestHuman(humans.filter(h => h.infectionProgress === 0))

        if (closestHuman && this.isHumanNear(closestHuman)) {
            //Идёт к человеку
            this.chase(closestHuman);
            this.currentTarget = closestHuman;
            this.targetLockTimer = 100;
        } else {
            //Случайное блуждание
            this.randomWalk()

            
        }
    }

    isHumanNear(human) {
        return Math.hypot(this.x - human.x, this.y - human.y) < this.detectionRadius
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
        this.x = Math.max(10, Math.min(790, this.x))
        this.y = Math.max(10, Math.min(590, this.y))
    }

    findClosestHuman(humans) {
        if(humans.length === 0) return null

        return humans.reduce((closest, human) => {
            const dist = Math.hypot(this.x - human.x, this.y - human.y)
            return dist < closest.dist ? { human, dist } : closest
          }, { human: null, dist: Infinity }).human
    }
}