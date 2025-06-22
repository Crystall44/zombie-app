<script>
import {Human, Zombie } from './models.js'

  export default{
    data() {
      return {
        humans: [],
        zombies: [],
        ctx: null,
        animationId: null,
        population: 100,
        lastTime: 0,
        stats: {
          healthy: 0,
          infected: 0,
          zombies: 0
        }
      }
    },
    mounted() {
      this.initWorld()
    },
    methods: {
          initWorld() {
            this.ctx = this.$refs.canvas.getContext('2d')

            //Создание людей
            for(let i = 0; i < this.population; i++) {
              this.humans.push(new Human(Math.random() * 700 + 50, Math.random() * 500 + 50))
            }
            //Доработат!!!!
            //Первый Зомби
            this.zombies.push(new Zombie(100, 100))

            this.lastTime = performance.now()
            this.drawWorld()
          },

          drawWorld() {
            this.ctx.clearRect(0,0,800,600)

            //Рисование людей
            this.humans.forEach(human => {
              //Меняем цвет при заражении
              this.ctx.fillStyle = human.infectionProgress > 0 ?
              `hsl(${240 - (120 * human.infectionProgress/100)}, 100%, 50%)` :
              human.color

              this.ctx.beginPath()
              this.ctx.arc(human.x, human.y, human.radius, 0, Math.PI * 2)
              this.ctx.fill()

              //Индикатор заражения
              if(human.infectionProgress > 0) {
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'
                this.ctx.lineWidth = 2
                this.ctx.beginPath()
                this.ctx.arc(human.x, human.y, human.radius + 3, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * human.infectionProgress/100)
                this.ctx.stroke()
              }
            })

            //Рисование Зомби
            this.zombies.forEach(zombie => {
              this.ctx.fillStyle = zombie.color
              this.ctx.beginPath()
              this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2)
              this.ctx.fill()

              //Зона заражения
              this.ctx.fillStyle = 'rgba(46, 204, 113, 0.08)'
              this.ctx.beginPath()
              this.ctx.arc(zombie.x, zombie.y, zombie.infectionRadius, 0, Math.PI * 2)
              this.ctx.fill()
            })

            //Статистика
            this.updateStats()
          },

          startSim() {
            this.lastTime = performance.now()
            this.animationId = requestAnimationFrame(this.update)
          },

          update(currentTime) {
            const deltaTime = currentTime - this.lastTime
            this.lastTime = currentTime

            //Двигаем всех
            this.humans.forEach(h => h.move(this.zombies))
            this.zombies.forEach(z => z.move(this.humans))

            //Проверяем заражение
            this.humans.forEach(human => {
              this.zombies.forEach(zombie =>{
                const dist = Math.hypot(zombie.x - human.x, zombie.y - human.y)
                if (dist < zombie.infectionRadius && human.infectionProgress === 0) {
                  human.infectionProgress = 0.1
                }
              })

              //Обновление прогресса заражения
              if(human.infectionProgress > 0){
                human.updateInfection(deltaTime)
              }
            })

            //Превращение заражённых в Зомби
            const newZombies = []
            this.humans = this.humans.filter(human => {
              if (human.infectionProgress >= 100) {
                newZombies.push(new Zombie(human.x, human.y))
                return false
              }
              return true
            })

            this.zombies.push(...newZombies)
            this.updateStats()

            //Перерисовка
            this.drawWorld()

            //Продолжаем пока есть здоровые люди
            if(this.humans.some(h => h.infectionProgress === 0)) {
              this.animationId = requestAnimationFrame(this.update)
            } else {
              console.log("Все заражены или превратились в зомби!")
            }
          },

          updateStats() {
            this.stats = {
              healthy: this.humans.filter(h => h.infectionProgress === 0).length,
              infected: this.humans.filter(h => h.infectionProgress > 0).length,
              zombies: this.zombies.length
            }
          },

          beforeDestroy() {
            cancelAnimationFrame(this.animationId)
          }
        }
      }
</script>

<template>
  <div class="simulation">
    <canvas ref="canvas" width="800" height="600"></canvas>
    <div class="controls">
      <button @click="startSim">Старт</button>
      <div class="stats">
        <p>Здоровые люди: {{ stats.healthy }}</p>
        <p>Зараженные: {{ stats.infected }}</p>
        <p>Зомби: {{ stats.zombies }}</p>
      </div>
    </div>
  </div>
</template>

<style>
.simulation {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family:Arial, sans-serif;
}
canvas {
  border: 1px solid #333;
  background: #f5f5f5;
  margin-bottom: 10px;
}

.controls {
  display: flex;
  gap: 20px;
  align-items: center;
}

button {
  padding: 8px 16px;
  background: #3498db;
  color:white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.stats {
  display: flex;
  gap: 15px;
}

.stats p {
  margin: 0;
  color: #333;
}
</style>