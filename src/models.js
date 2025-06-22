//Класс Человека
export class Human {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.radius = 5
        this.speed = 1
        this.infected = false
        this.color = 'hsl(240, 100%, 50%)'//Синий
        this.detectionRadius = 100
        this.panicMode = false
        this.infectionProgress = 0
        this.infectionTime = 2000
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
            //Случайное блуждание
            this.randomWalk()
            this.panicMode = false
        }
    }

    isZombieNear(zombie) {
        return Math.hypot(this.x - zombie.x, this.y - zombie.y) < this.detectionRadius
    }

    runFrom(zombie) {
        const angle = Math.atan2(this.y - zombie.y, this.x - zombie.x)
        this.x += Math.cos(angle) * this.speed   //Доработать!!!!
        this.y += Math.sin(angle) * this.speed
        this.applyBoundaries()
    }

    randomWalk() {
        this.x += (Math.random() - 0.5) * this.speed
        this.y += (Math.random() - 0.5) * this.speed
        this.applyBoundaries()
    }

    applyBoundaries() {
        this.x = Math.max(10, Math.min(790, this.x))
        this.y = Math.max(10, Math.min(590, this.y))
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
}

//Класс Зомби
export class Zombie {
    constructor(x, y){
        this.x = x
        this.y = y
        this.radius = 8
        this.speed = 0.9
        this.detectionRadius = 150
        this.infectionRadius = 20
        this.color = 'hsl(120, 100%, 50%)'//Зелёный
    }

    move(humans) {
        const closestHuman = this.findClosestHuman(humans.filter(h => h.infectionProgress === 0))

        if (closestHuman && this.isHumanNear(closestHuman)) {
            //Идёт к человеку
            this.chase(closestHuman)
        } else {
            //Случайное блуждание
            this.randomWalk()
        }
    }

    isHumanNear(human) {
        return Math.hypot(this.x - human.x, this.y - human.y) < this.detectionRadius
    }

    chase(human){
        const angle = Math.atan2(human.y - this.y, human.x - this.x)
        this.x += Math.cos(angle) * this.speed
        this.y += Math.sin(angle) * this.speed
        this.applyBoundaries()
    }

    randomWalk(){
        this.x += (Math.random() - 0.5) * this.speed * 0.7
        this.y += (Math.random() - 0.5) * this.speed * 0.7
        this.applyBoundaries()
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