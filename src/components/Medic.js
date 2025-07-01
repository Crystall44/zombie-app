export class Medic {
    constructor(x, y, speed = 1.2, healingPower = 2, detectionRadius = 150, infectionTime = 6000) {
        this.x = x || Math.random() * 700 + 50;
        this.y = y || Math.random() * 500 + 50;
        this.speed = speed;
        this.healingPower = healingPower;
        this.detectionRadius = detectionRadius;
        this.infectionTime = infectionTime;
        this.radius = 6;
        this.color = 'hsl(165, 80%, 60%)';
        this.currentTarget = null;
        this.direction = Math.random() * Math.PI * 2;
        this.walkCucle = 0;
        this.infectionProgress = 0;
        this.isHealing = false;
        this.panicMode = false;
        this.panicTimer = 0;
        this.lastThreatPos = null;
    }

    move(humans, zombies, medics) {

        //Если уже заражён - просто бродит
        if(this.infectionProgress > 0) {
            this.moveInfected(medics);
            return;
        }

        const infectedHumans = humans.filter(h => h.infectionProgress > 0 && h.infectionProgress < 100);
        const infectedMedics = medics.filter(m => m.infectionProgress > 0 && m.infectionProgress < 100);
        const infected = this.findClosestInfected([...infectedHumans, ...infectedMedics]);

        const nearestZombie = this.findClosestZombie(zombies);

        if (nearestZombie && this.isZombieNear(nearestZombie)) {
            this.runFrom(nearestZombie);
            this.panicMode = true;
            this.panicTimer = 60;
            if (this.currentTarget) {
                this.currentTarget.isHealing = false;
                this.currentTarget = null;
                this.isHealing = false;
            }
            return;
        }
        if(this.panicTimer > 0) {
            this.panicTimer--;
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            this.applyBoundaries();
            return;
        }

        this.panicMode = false;
        if(infected) {
            if(this.distanceTo(infected) < this.detectionRadius) {
                this.currentTarget = infected;
                this.goTo(this.currentTarget);
            } else {
                this.randomWalk();
            }

            if(this.distanceTo(infected) < this.radius + infected.radius + 3) {
                this.isHealing = true;
                this.heal(infected);
            } else {
                this.isHealing = false;
                if(this.currentTarget) this.currentTarget.isHealing = false;
            }
        } else {
            this.isHealing = false;
            if (this.currentTarget) {
                this.currentTarget.isHealing = false;
                this.currentTarget = null;
            }
            this.randomWalk();
        }
    }

    isZombieNear(zombie) {
        return Math.hypot(this.x - zombie.x, this.y - zombie.y) < this.detectionRadius;
    }

    heal(human) {
        human.infectionProgress = Math.max(0, human.infectionProgress - this.healingPower);
        human.isHealing = true;
        if(human.infectionProgress === 0) {
            human.infected = false;
            human.isHealing = false;
            if(this.currentTarget) {
                this.currentTarget = null;
            }
        }
    }

    goTo(infected) {
        // Плавное изменение направления
        const targetDir = Math.atan2(infected.y - this.y, infected.x - this.x);
        
        if (typeof this.direction === 'undefined') {
            this.direction = targetDir;
        } else {
            // Мягкая корректировка курса (20% от разницы)
            const angleDiff = ((targetDir - this.direction + Math.PI) % (Math.PI * 2)) - Math.PI;
            this.direction += angleDiff * 0.3;
        }

        // Случайные микрокоррекции для естественности
        this.direction += (Math.random() - 0.5) * 0.02;

        // Динамическая скорость (медленнее при приближении)
        const dist = this.distanceTo(infected);
        const speed = dist < 50 ? this.speed * (dist / 50) * 0.8 : this.speed;

        this.x += Math.cos(this.direction) * speed;
        this.y += Math.sin(this.direction) * speed;

        // Интеллектуальное избегание стен
        const nextX = this.x + Math.cos(this.direction) * 30;
        const nextY = this.y + Math.sin(this.direction) * 30;
        
        if (nextX < 20 || nextX > 780 || nextY < 20 || nextY > 580) {
            this.direction += (Math.random() - 0.3) * 0.2;
        }

        this.applyBoundaries();
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
            this.direction = Math.random() * Math.PI * 2;
        }

        this.direction += (Math.random() - 0.5) * 0.15;

        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

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
        this.x = Math.max(10, Math.min(790, this.x));
        this.y = Math.max(10, Math.min(590, this.y));
    }

    avoidWalls() {
        const margin = 30;
        const nextX = this.x + Math.cos(this.direction) * margin;
        const nextY = this.y + Math.sin(this.direction) * margin;

        if(nextX < 10 || nextX > 790) {
            this.direction = nextY < this.y ? -Math.PI/2 : Math.PI/2;
        }
        else if (nextY < 10 || nextY > 590) {
            this.direction = nextX < this.x ? Math.PI : 0;
        }
    }

    findClosestInfected(humans) {
        if(humans.length === 0) return null;
        return humans.reduce((closest, human) => {
            const dist = Math.hypot(this.x - human.x, this.y - human.y)
            return dist < closest.dist ? { human, dist } : closest
          }, { human: null, dist: Infinity }).human;
    }

    findClosestZombie(zombies) {
        if(zombies.length === 0) return null;

        return zombies.reduce((closest, zombie) => {
            const dist = Math.hypot(this.x - zombie.x, this.y - zombie.y)
            return dist < closest.dist ? {zombie, dist} : closest
        }, {zombie: null, dist: Infinity}).zombie;
    }

    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
    }

    updateInfection(deltaTime){
        if(this.infectionProgress > 0){
            this.infectionProgress += deltaTime / this.infectionTime * 100;
            this.color = `hsl(${165 - (165 * this.infectionProgress/100)}, ${80 + (20 * this.infectionProgress/100)}%, ${60 - (30 * this.infectionProgress/100)}%)`;
        }
    }

    findClosestMedic(medics) {
        if(medics.length === 0) return null;

        return medics.reduce((closest, medic) => {
            const dist = Math.hypot(this.x - medic.x, this.y - medic.y);
            return dist < closest.dist ? {medic, dist} : closest;
        }, {medic: null, dist: Infinity}).medic;
    }

    moveInfected(medics) {
        if(this.infectionProgress > 0 && this.infectionProgress < 100) {
            const availableMedics = medics.filter(m => 
                m.infectionProgress === 0
            );
            const closestMedic = this.findClosestMedic(availableMedics);

            if(closestMedic && !closestMedic.panicMode) {
                const distToMedic = Math.hypot(this.x - closestMedic.x, this.y - closestMedic.y);

                if(distToMedic < this.detectionRadius * 2) {
                    const angle = Math.atan2(closestMedic.y - this.y, closestMedic.x - this.x);

                    this.direction = angle + (Math.random() - 0.5) * 0.1;

                    this.x += Math.cos(this.direction) * this.speed;
                    this.y += Math.sin(this.direction) * this.speed;
                    this.applyBoundaries();
                    return;
                }
            }

            this.randomWalk();
        }
    }

}