export class Guardian {
    constructor(x, y, speed = 0.6, detectionRadius = 100, attackRadius = 50, attackPower = 1, attackRate = 60, maxHealth = 3) {
        this.x = x || Math.random() * 700 + 50;
        this.y = y || Math.random() * 500 + 50;
        this.detectionRadius = detectionRadius; 
        this.speed = speed;
        this.radius = 7;
        this.color = 'hsl(225, 85%, 40%)';
        this.direction = Math.random() * Math.PI * 2;
        this.walkCucle = 0;
        this.currentTarget = null;
        this.attackPower = attackPower;
        this.attackCooldown = 0;
        this.attackRate = attackRate;
        this.attackRadius = attackRadius;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
    }

    move(zombies) {
        if(!this.currentTarget || this.currentTarget.health <= 0) {
            this.currentTarget = this.findClosestZombie(zombies.filter(z => z.health > 0));
        }

        if(this.currentTarget) {
            const dist = this.distanceTo(this.currentTarget);

            if(dist < this.attackRadius) {
                this.attack(this.currentTarget);
            }
            else if(dist < this.detectionRadius) {
                this.chase(this.currentTarget);
            }
            else {
                this.currentTarget = null;
                this.randomWalk();
            }
        } else {
            this.randomWalk();
        }

        if(this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    attack(zombie) {
        if(this.attackCooldown <= 0) {
            zombie.health -= this.attackPower;
            this.attackCooldown = this.attackRate;
            if(zombie.health <= 0) {
                this.currentTarget = null;
            }
        }
    }

    chase(zombie) {
        this.direction = Math.atan2(zombie.y - this.y, zombie.x - this.x);
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
    }

    randomWalk() {
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

    findClosestZombie(zombies) {
        if(zombies.length === 0) return null;

        return zombies.reduce((closest, zombie) => {
            const dist = this.distanceTo(zombie);
            return dist < closest.dist ? {zombie, dist} : closest;
        }, {zombie: null, dist: Infinity}).zombie;
    }

    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
    }

    applyBoundaries() {
        this.x = Math.max(10, Math.min(790, this.x));
        this.y = Math.max(10, Math.min(590, this.y));
    }
}