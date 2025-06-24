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
        },
        simulationEnd: false,
        minDist: 100,
        isRunning: false,
        isPaused:false,
        simulationStarted: false
      }
    },
    mounted() {
      this.initWorld()
    },
    computed: {
      mainButtonText() {
        if(this.simulationEnd) return 'Начать заново';
        if(this.isPaused) return 'Продолжить'
        return this.isRunning ? 'Остановить' : 'Начать симуляцию';
      }
    },
    methods: {
          handleControlClick() {
            if(this.isRunning) {
              this.stopSim();
              this.isRunning = false;
              this.isPaused = true;
            } else {
              if(!this.simulationStarted) {
                this.initWorld();
              }
              this.startSim();
              this.isRunning = true;
              this.isPaused = false;
            }
          },

          initWorld() {
            this.ctx = this.$refs.canvas.getContext('2d')

            //Создание людей
            for(let i = 0; i < this.population; i++) {
              this.humans.push(new Human(Math.random() * 700 + 50, Math.random() * 500 + 50))
            }

            this.spawnZombie(50);

            this.lastTime = performance.now()
            this.drawWorld()
            this.simulationStarted = true;
          },

          spawnZombie(minDist) {
            let attempts = 0;
            const maxAttempts = 100;

            while (attempts < maxAttempts) {
              const x = Math.random() * 700 + 50;
              const y = Math.random() * 500 + 50;

              const tooClose = this.humans.some(human => human.isTooClose(x, y, minDist));
              if(!tooClose) {
                this.zombies.push(new Zombie(x, y));
                return;
              }

              attempts++;
            }

            this.zombies.push(new Zombie(Math.random() * 700 + 50, Math.random() * 500 + 50));
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
            this.simulationEnd = false;
            if(!this.simulationStarted) {
              this.initWorld();
            }
            this.lastTime = performance.now()
            this.animationId = requestAnimationFrame(this.update)
          },

          stopSim() {
            cancelAnimationFrame(this.animationId);
          },

          resetSim() {
            this.stopSim();
            this.humans = [];
            this.zombies = [];
            this.simulationEnd = false;
            this.simulationStarted = false;
            this.isPaused = false;
            this.isRunning = false;
            this.stats = { healthy: 0, infected: 0, zombies: 0 };
            this.initWorld();
          },

          update(currentTime) {
            if(!this.isRunning) return;

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

            //Продолжаем пока не осталось людей и зараженных
            if(this.humans.length > 0) {
              this.animationId = requestAnimationFrame(this.update)
            } else {
              this.simulationEnd = true;
              this.isRunning = false;
              return;
            }
          },

          updateStats() {
            this.stats = {
              healthy: this.humans.filter(h => h.infectionProgress === 0).length,
              infected: this.humans.filter(h => h.infectionProgress > 0).length,
              zombies: this.zombies.length
            }
          },

          showEndMessage(message) {
            alert(message);
          },

          beforeDestroy() {
            cancelAnimationFrame(this.animationId)
          }
        }
      }
</script>

<template>
  <div class="simulation-container">
    <canvas ref="canvas" width="800" height="600" class="simulation-canvas"></canvas>
    <div class="controls-panel">
      <div class="buttons-container">
      <button @click="handleControlClick" :class="['control-button', {
        'stop-button': isRunning,
        'continue-button': isPaused && !simulationEnd,
        'start-button': !isRunning && !isPaused
        }]">{{ mainButtonText }}</button>
      <button 
        v-if="isPaused || simulationEnd"
        @click="resetSim"
        class="reset-button"
      >Начать заново</button>
      </div>

      <div v-if="simulationEnd" class="end-message">
        <h3>Симуляция завершена!</h3>
        <p>Все люди превратились в зомби.</p>
      </div>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Здоровые:</span>
          <span class="stat-value">{{ stats.healthy }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Зараженные:</span>
          <span class="stat-value">{{ stats.infected }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Зомби:</span>
          <span class="stat-value">{{ stats.zombies }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>

.simulation-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  max-width: 100vw;
  overflow: auto;
}

.simulation-canvas {
  width: 800px;
  height:600px;
  border: 1px solid #333;
  background: white;
  flex-shrink: 0;
}

.controls-panel {
  margin-left:20px;
  min-width:200px;
  font-family: 'Segoe UI', Arial, sans-serif;
  display:flex;
  flex-direction:column;
}

.control-button {
  padding: 12px 24px;
  margin-bottom:20px;
  font-weight:normal;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap:10px;
  margin-top:20px;
}

.stop-button {
  background: #e74c3c;
}

.continue-button {
  background: #2ecc71;
}

.reset-button {
  padding: 12px 24px;
  margin-bottom:20px;
  font-weight:normal;
  background: #f39c12;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  
}

.reset-button:hover {
  background: #e67e22;
}

.control-button:hover, .reset-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top:auto;
  padding-top:20px;
  border-rop:1px solid #eee;
}

.stats p {
  margin: 0;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-item {
  margin: 8px 0;
  fonr-size:14px;
}

.stat-label {
  display:inline-block;
  width: 100px;
  color: #555;
}

.stat-value {
  font-weight:bold;
  color: #333;
}

.end-message {
  margin-top:20px;
  padding:15px;
  background: #f8f8f8;
  border-radius: 5px;
  border-left: 4px solid #e74c3c;
  animation: fadeIn 0.5s;
}

.end-message h3 {
  color: #e74c3c;
  margin-bottom:5px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>