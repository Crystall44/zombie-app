<script>
import {Zombie} from './components/Zombie.js'
import {Human} from './components/Human.js'
import {Medic} from './components/Medic.js'
import {Guardian} from './components/Guardian.js'

  export default{
    data() {
      return {
        humans: [],
        zombies: [],
        medics: [],
        guardians: [],
        ctx: null,
        animationId: null,
        showHumanSettings: false,
        showZombieSettings: false,
        showMedicSettings: false,
        showGuardianSettings: false,
        startTime: 0,
        elapsedTime: 0,
        pauseTime: 0,
        lastPauseTime: 0,
        lastTime: 0,
        stats: {
          healthy: 0,
          infected: 0,
          zombies: 0,
          medics: 0,
          guardians: 0,
          time: '00:00'
        },
        simulationEnd: false,
        minDist: 100,
        isRunning: false,
        isPaused:false,
        simulationStarted: false,
        showSettings:true,
        tempSettings: null,
        defaultSettings: {
          population: 100,
          humanSpeed: 1.0,
          zombieSpeed: 0.9,
          detectionRadiusHumans: 100,
          infectionRadius: 25,
          infectionTime: 3000,
          zombiePopulation: 1,
          medicSpeed: 1.2,
          healingPower: 2,
          detectionRadiusMedic: 150,
          infectionTimeMedic: 6000,
          guardianSpeed: 0.6,
          detectionRadiusGuardian: 100,
          attackRadiusGuardian: 50,
          medicsPopulation: 5,
          guardiansPopulation: 5,
          detectionRadiusZombie: 150,
          maxHealthZombie: 5,
          attackPowerZombie: 1,
          attackRateZombie: 60,
          attackPowerGuardian: 1,
          attackRateGuardian: 60,
          maxHealthGuardian: 3
        },
        settings: {
          population: 100,
          humanSpeed: 1.0,
          zombieSpeed: 0.9,
          detectionRadiusHumans: 100,
          infectionRadius: 25,
          infectionTime: 3000,
          zombiePopulation: 1,
          medicSpeed: 1.2,
          healingPower: 2,
          detectionRadiusMedic: 150,
          infectionTimeMedic: 6000,
          guardianSpeed: 0.6,
          detectionRadiusGuardian: 100,
          attackRadiusGuardian: 50,
          medicsPopulation: 5,
          guardiansPopulation: 5,
          detectionRadiusZombie: 150,
          maxHealthZombie: 5,
          attackPowerZombie: 1,
          attackRateZombie: 60,
          attackPowerGuardian: 1,
          attackRateGuardian: 60,
          maxHealthGuardian: 3
        }
      }
    },
    mounted() {
      this.initWorld();
    },
    computed: {
      mainButtonText() {
        if(this.simulationEnd) return 'Начать заново';
        if(this.isPaused) return 'Продолжить';
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
              this.startSim();
              this.isRunning = true;
              this.isPaused = false;
            }
          },

          initWorld() {
            this.ctx = this.$refs.canvas.getContext('2d');
            this.humans = [];
            this.zombies = [];
            this.medics = [];
            this.guardians = [];

            //Создание людей
            for(let i = 0; i < this.settings.population; i++) {
              const human = new Human(Math.random() * 700 + 50, Math.random() * 500 + 50,this.settings.humanSpeed, this.settings.infectionTime, this.settings.detectionRadiusHumans);
              this.humans.push(human);
            }

            for(let i = 0; i < this.settings.medicsPopulation; i++) {
              const medic = new Medic(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.medicSpeed, this.settings.healingPower, this.settings.detectionRadiusMedic, this.settings.infectionTimeMedic);
              this.medics.push(medic);
            }

            for(let i = 0; i < this.settings.guardiansPopulation; i++) {
              const guardian = new Guardian(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.guardianSpeed, this.settings.detectionRadiusGuardian, this.settings.attackRadiusGuardian, this.settings.attackPowerGuardian, this.settings.attackRateGuardian, this.settings.maxHealthGuardian);
              this.guardians.push(guardian);
            }

            for(let i = 0; i < this.settings.zombiePopulation; i++) {
              this.spawnZombie(50);
            }

            this.lastTime = performance.now();
            this.drawWorld();
          },

          spawnZombie(minDist) {
            let attempts = 0;
            const maxAttempts = 50;

            while (attempts < maxAttempts) {
              const x = Math.random() * 700 + 50;
              const y = Math.random() * 500 + 50;

              const tooClose = this.humans.some(human => human.isTooClose(x, y, minDist));
              if(!tooClose) {
                const zombie = new Zombie(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.zombieSpeed, this.settings.infectionRadius, this.settings.detectionRadiusZombie, this.settings.maxHealthZombie, this.settings.attackPowerZombie, this.settings.attackRateZombie);
                this.zombies.push(zombie);
                return;
              }

              attempts++;
            }

            const zombie = new Zombie(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.zombieSpeed, this.settings.infectionRadius, this.settings.detectionRadiusZombie, this.settings.maxHealthZombie, this.settings.attackPowerZombie, this.settings.attackRateZombie);
            this.zombies.push(zombie);
            return;
          },

          drawWorld() {
            this.ctx.clearRect(0,0,800,600);

            //Рисование людей
            this.humans.forEach(human => {
              this.ctx.fillStyle = human.color;
              this.ctx.beginPath();
              this.ctx.arc(human.x, human.y, human.radius, 0, Math.PI * 2);
              this.ctx.fill();

              //Индикатор заражения
              if(human.infectionProgress > 0) {
                this.ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(human.x, human.y, human.radius + 3, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * human.infectionProgress/100);
                this.ctx.stroke();
              }
            })

             this.medics.forEach(medic => {
              // Основной круг медика (как у людей и зомби)
              this.ctx.fillStyle = medic.color;
              this.ctx.beginPath();
              this.ctx.arc(medic.x, medic.y, medic.radius, 0, Math.PI*2);
              this.ctx.fill();

              // Индикатор заражения (если медик заражен) - как у людей
              if(medic.infectionProgress > 0) {
                  this.ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
                  this.ctx.lineWidth = 2;
                  this.ctx.beginPath();
                  this.ctx.arc(
                      medic.x, medic.y, 
                      medic.radius + 3, 
                      -Math.PI/2, 
                      -Math.PI/2 + 2 * Math.PI * medic.infectionProgress/100
                  );
                  this.ctx.stroke();
              }

              // Анимация лечения - простая пульсация
              if (medic.isHealing) {
                  // Пульсирующий зеленый круг
                  const pulse = Math.sin(Date.now() / 300) * 2; // Простая пульсация
                  this.ctx.strokeStyle = 'rgba(100, 255, 180, 0.8)';
                  this.ctx.lineWidth = 2;
                  this.ctx.beginPath();
                  this.ctx.arc(medic.x, medic.y, medic.radius + 3 + pulse, 0, Math.PI*2);
                  this.ctx.stroke();
              }
              })

              this.guardians.forEach(guardian => {
                this.ctx.save();
                this.ctx.fillStyle = guardian.color;
                this.ctx.beginPath();
                this.ctx.arc(guardian.x, guardian.y, guardian.radius, 0, Math.PI*2);
                this.ctx.fill();

                // Металлический ободок (для эффекта брони)
                this.ctx.strokeStyle = 'hsla(200, 30%, 80%, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(guardian.x, guardian.y, guardian.radius + 1, 0, Math.PI*2);
                this.ctx.stroke();

                this.ctx.fillStyle = 'rgba(80, 60, 160, 0.08)';
                this.ctx.beginPath();
                this.ctx.arc(guardian.x, guardian.y, guardian.attackRadius, 0, Math.PI * 2);
                this.ctx.fill();

                if(guardian.health < guardian.maxHealth) {
                const healthWidth = 20;
                const healthHeight = 3;
                const healthX = guardian.x - healthWidth/2;
                const healthY = guardian.y - guardian.radius - 5;

                this.ctx.fillStyle = "rgba(0,0,0,0.5)";
                this.ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
                const hpPercent = guardian.health / guardian.maxHealth;
                this.ctx.fillStyle = hpPercent > 0.6 ? '#2ecc71' : hpPercent > 0.3 ? '#f39c12' : '#e74c3c';
                this.ctx.fillRect(healthX, healthY, healthWidth * hpPercent, healthHeight);
                this.ctx.restore();
              }
              })

            //Рисование Зомби
            this.zombies.forEach(zombie => {
              this.ctx.save();
              this.ctx.fillStyle = zombie.color
              this.ctx.beginPath()
              this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2)
              this.ctx.fill()
              if(zombie.health < zombie.maxHealth) {
                const healthWidth = 20;
                const healthHeight = 3;
                const healthX = zombie.x - healthWidth/2;
                const healthY = zombie.y - zombie.radius - 5;

                this.ctx.fillStyle = "rgba(0,0,0,0.5)";
                this.ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
                const hpPercent = zombie.health / zombie.maxHealth;
                this.ctx.fillStyle = hpPercent > 0.6 ? '#2ecc71' : hpPercent > 0.3 ? '#f39c12' : '#e74c3c';
                this.ctx.fillRect(healthX, healthY, healthWidth * hpPercent, healthHeight);
              }

              //Зона заражения
              this.ctx.fillStyle = 'rgba(139, 0, 0, 0.1)'
              this.ctx.beginPath()
              this.ctx.arc(zombie.x, zombie.y, zombie.infectionRadius, 0, Math.PI * 2)
              this.ctx.fill()
              this.ctx.restore();
            })

            //Статистика
            this.updateStats()
          },

          saveSettings() {
            this.tempSettings = JSON.parse(JSON.stringify(this.settings));
            this.showSettings = false;
            this.initWorld();
          },

          cancelSettings() {
            if (this.tempSettings) {
              this.settings = JSON.parse(JSON.stringify(this.tempSettings));
              this.$nextTick(() => {
              this.$forceUpdate();
            })
            }

            this.showSettings = true;
          },

          resetSettings() {
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));

            this.$nextTick(() =>{
              this.$forceUpdate();
              this.initWorld();
            })
          },

          startSim() {
            if(!this.simulationStarted) {
              this.startTime = performance.now();
              this.pauseTime = 0;
              this.elapsedTime = 0;
              this.simulationEnd = false;
              this.simulationStarted = true;
            } else {
              if(this.isPaused) {
                this.pauseTime += performance.now() - this.lastPauseTime;
                this.isPaused = false;
              }
            }
            this.lastTime = performance.now()
            this.animationId = requestAnimationFrame(this.update)
          },

          stopSim() {
            cancelAnimationFrame(this.animationId);
            this.lastPauseTime = performance.now();
          },

          resetSim() {
            this.stopSim();
            this.humans = [];
            this.zombies = [];
            this.medics = [];
            this.guardians = [];
            this.startTime = 0;
            this.pauseTime = 0;
            this.lastPauseTime = 0;
            this.elapsedTime = 0;
            this.simulationEnd = false;
            this.simulationStarted = false;
            this.isPaused = false;
            this.isRunning = false;
            this.stats = { healthy: 0, infected: 0, zombies: 0, medics: 0, guardians: 0, time: '00:00'};
            this.showSettings = true;
            this.initWorld();
          },

          update(currentTime) {
            if(!this.isRunning) return;

            const deltaTime = currentTime - this.lastTime
            this.lastTime = currentTime

            //Двигаем всех
            this.humans.forEach(h => h.move(this.zombies, this.medics))
            this.zombies.forEach(z => z.move(this.humans, this.medics, this.guardians))
            this.medics.forEach(m => m.move(this.humans, this.zombies, this.medics))
            this.guardians.forEach(g => g.move(this.zombies))

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

            this.medics.forEach(medic => {
              this.zombies.forEach(zombie =>{
                const dist = Math.hypot(zombie.x - medic.x, zombie.y - medic.y)
                if (dist < zombie.infectionRadius && medic.infectionProgress === 0) {
                  medic.infectionProgress = 0.1
                }
              })

              //Обновление прогресса заражения
              if(medic.infectionProgress > 0){
                medic.updateInfection(deltaTime)
              }
            })

            //Превращение заражённых в Зомби
            this.medics = this.medics.filter(medic => {
              if (medic.infectionProgress >= 100) {
                const zombie = new Zombie(medic.x, medic.y, this.settings.zombieSpeed, this.settings.infectionRadius);
                this.zombies.push(zombie);
                return false
              }
              return true
            })

            this.humans = this.humans.filter(human => {
              if (human.infectionProgress >= 100) {
                const zombie = new Zombie(human.x, human.y, this.settings.zombieSpeed, this.settings.infectionRadius);
                this.zombies.push(zombie);
                return false
              }
              return true
            })

            this.zombies = this.zombies.filter(z => {
              if(z.health <= 0) {
                return false;
              }
              return true;
            })

            this.guardians = this.guardians.filter(g => {
              if(g.health <= 0) {
                return false;
              }
              return true;
            })

            this.updateStats()

            //Перерисовка
            this.drawWorld()

            //Продолжаем пока не осталось людей и зараженных
            if((this.humans.length > 0 || this.medics.length > 0) && (this.zombies.length > 0)) {
              this.animationId = requestAnimationFrame(this.update)
            } else {
              this.simulationEnd = true;
              this.isRunning = false;
              return;
            }
          },

          updateStats() {
            if(this.simulationStarted && !this.isPaused){
              this.elapsedTime = performance.now() - this.startTime - this.pauseTime;
            }
            this.stats = {
              healthy: this.humans.filter(h => h.infectionProgress === 0).length,
              infected: (this.humans.filter(h => h.infectionProgress > 0).length + this.medics.filter(m => m.infectionProgress > 0).length),
              zombies: this.zombies.length,
              medics: this.medics.filter(m => m.infectionProgress === 0).length,
              guardians: this.guardians.filter(g => g.health > 0).length,
              time: `${Math.floor((Math.floor(this.elapsedTime/1000))/60).toString().padStart(2, '0')}:${(Math.floor(this.elapsedTime/1000) % 60).toString().padStart(2, '0')}`
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
      <button v-if="!simulationEnd" @click="handleControlClick" :class="['control-button', {
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

      <div v-if="simulationEnd" class="simulation-end">
        <div class="end-card" :class="{ 'win': zombies.length === 0, 'loss': zombies.length > 0 }">
          <div class="end-icon">
            <span v-if="zombies.length === 0">🎉</span>
            <span v-else>☠️</span>
          </div>
          <div class="end-content">
            <h3>{{ zombies.length === 0 ? 'Победа!' : 'Симуляция завершена'}}</h3>
            <p v-if="zombies.length === 0" class="outcome-message">
              Все зомби уничтожены!<br>
              <small>Выжившие: {{ stats.healthy }} человек, {{ stats.medics }} медиков, {{ stats.guardians }} защитников.</small>
            </p>

            <p v-else-if="humans.length === 0 && medics.length === 0 && guardians.length === 0" class="outcome-message">
              Зомби апокалипсис наступил!<br>
              <small>Все люди превратились в {{ stats.zombies }} зомби.</small>
            </p>

            <p v-else-if="humans.length === 0 && medics.length === 0 && guardians.length > 0" class="outcome-message">
              Защитники устояли<br>
              <small>Но все мирные жители погибли (осталось {{ stats.guardians }} защитников).</small>
            </p>

            <div class="time-stats">
              <span class="time-icon">⏱️</span>
              Время симуляции: {{ stats.time }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!simulationStarted" class="settings-panel">
        <div class="setting-item">
          <div class="setting-label-with-icon">
            <label>Количество людей: {{  settings.population  }}</label>
            <button @click="showHumanSettings = !showHumanSettings" class="settings-icon-button" title="Настройки">⚙️</button>
          </div>
          <input type="range" v-model.number="settings.population" min = "1" max = "300" step="1" class="slider">
          <div v-if="showHumanSettings" class="mini-settings-panel">
            <div class="mini-setting-item">
              <label>Скорость людей: {{  settings.humanSpeed.toFixed(1)  }}</label>
              <input type="range" v-model.number="settings.humanSpeed" min = "0.1" max = "5" step="0.1" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Время превращения (сек): {{  (settings.infectionTime/1000).toFixed(1)  }}</label>
              <input type="range" v-model.number="settings.infectionTime" min = "100" max = "10000" step="100" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Дальность видимости: {{  settings.detectionRadiusHumans  }}</label>
              <input type="range" v-model.number="settings.detectionRadiusHumans" min = "25" max = "300" step="5" class="slider">
            </div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label-with-icon">
            <label>Количество зомби: {{  settings.zombiePopulation  }}</label>
            <button @click="showZombieSettings = !showZombieSettings" class="settings-icon-button" title="Настройки">⚙️</button>
          </div>
          <input type="range" v-model.number="settings.zombiePopulation" min = "1" max = "50" step="1" class="slider">
          <div v-if="showZombieSettings" class="mini-settings-panel">
            <div class="mini-setting-item">
              <label>Скорость зомби: {{  settings.zombieSpeed  }}</label>
              <input type="range" v-model.number="settings.zombieSpeed" min = "0.1" max = "5" step="0.1" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Радиус заражения: {{  settings.infectionRadius  }}</label>
              <input type="range" v-model.number="settings.infectionRadius" min = "5" max = "100" step="5" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Дальность видимости: {{  settings.detectionRadiusZombie  }}</label>
              <input type="range" v-model.number="settings.detectionRadiusZombie" min = "25" max = "300" step="5" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Здоровье зомби: {{  settings.maxHealthZombie  }}</label>
              <input type="range" v-model.number="settings.maxHealthZombie" min = "1" max = "25" step="1" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Сила аттаки: {{  settings.attackPowerZombie  }}</label>
              <input type="range" v-model.number="settings.attackPowerZombie" min = "1" max = "25" step="1" class="slider">
            </div>
            <div class="mini-setting-item">
              <label>Задержка между аттаками: {{  (settings.attackRateZombie/60).toFixed(1)  }}</label>
              <input type="range" v-model.number="settings.attackRateZombie" min = "30" max = "600" step="30" class="slider">
            </div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label-with-icon">
            <label>Количество медиков: {{  settings.medicsPopulation  }}</label>
            <button @click="showMedicSettings = !showMedicSettings" class="settings-icon-button" title="Настройки">⚙️</button>
          </div>
          <input type="range" v-model.number="settings.medicsPopulation" min = "0" max = "25" step = "1" class = "slider">
          <div v-if="showMedicSettings" class="mini-settings-panel">
            <div class="mini-setting-item">
              <label>Скорость медиков: {{  settings.medicSpeed  }}</label>
              <input type="range" v-model.number="settings.medicSpeed" min = "0.1" max = "5" step = "0.1" class = "slider">
            </div>
            <div class="mini-setting-item">
              <label>Скорость лечения: {{  settings.healingPower  }}</label>
              <input type="range" v-model.number="settings.healingPower" min = "0.5" max = "20" step = "0.5" class = "slider">
            </div>
            <div class="mini-setting-item">
              <label>Дальность видимости: {{  settings.detectionRadiusMedic  }}</label>
              <input type="range" v-model.number="settings.detectionRadiusMedic" min = "25" max = "300" step = "5" class = "slider">
            </div>
            <div class="mini-setting-item">
              <label>Время превращения в зомби(сек): {{  (settings.infectionTimeMedic/1000).toFixed(1)  }}</label>
              <input type="range" v-model.number="settings.infectionTimeMedic" min = "100" max = "10000" step = "100" class = "slider">
            </div>
          </div>
        </div>
        
        <div class="setting-item">
        <div class="setting-label-with-icon">
          <label>Количество защитников: {{ settings.guardiansPopulation }}</label>
          <button @click="showGuardianSettings = !showGuardianSettings" class="settings-icon-button" title="Настройки">⚙️</button>
        </div>
          <input type="range" v-model.number="settings.guardiansPopulation" min = "0" max = "25" step = "1" class = "slider">
          <div v-if="showGuardianSettings" class="mini-settings-panel">
            <div class="mini-settings-item">
              <label>Скорость защитников: {{  settings.guardianSpeed  }}</label>
              <input type="range" v-model.number="settings.guardianSpeed" min = "0.1" max = "5" step = "0.1" class = "slider">
            </div>
            <div class="mini-settings-item">
              <label>Дальность видимости: {{  settings.detectionRadiusGuardian  }}</label>
              <input type="range" v-model.number="settings.detectionRadiusGuardian" min = "25" max = "300" step = "5" class = "slider">
            </div>
            <div class="mini-settings-item">
              <label>Дальность аттаки: {{  settings.attackRadiusGuardian  }}</label>
              <input type="range" v-model.number="settings.attackRadiusGuardian" min = "5" max = "100" step = "5" class = "slider">
            </div>
            <div class="mini-settings-item">
              <label>Сила аттаки: {{  settings.attackPowerGuardian  }}</label>
              <input type="range" v-model.number="settings.attackPowerGuardian" min = "1" max = "25" step = "1" class = "slider">
            </div>
            <div class="mini-settings-item">
              <label>Задержка между аттаками: {{  settings.attackRateGuardian  }}</label>
              <input type="range" v-model.number="settings.attackRateGuardian" min = "30" max = "600" step = "30" class = "slider">
            </div>
            <div class="mini-settings-item">
              <label>Здоровье защитника: {{  settings.maxHealthGuardian  }}</label>
              <input type="range" v-model.number="settings.maxHealthGuardian" min = "1" max = "25" step = "1" class = "slider">
            </div>
          </div>
        </div>

        <div class="settings-button">
          <button @click="saveSettings" class="settings-control-button">Сохранить</button>
          <button @click="cancelSettings" class="settings-cancel-button">Отменить</button>
          <button @click="resetSettings" class="settings-reset-button">Сбросить</button>
        </div>
      </div>


      <div v-if="simulationStarted || isRunning" class="stats">
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
        <div class="stat-item">
          <span class="stat-label">Медики:</span>
          <span class="stat-value">{{ stats.medics }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Защитники:</span>
          <span class="stat-value">{{ stats.guardians }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Время:</span>
          <span class="stat-value">{{ stats.time }}</span>
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

.settings-panel {
  margin:20px 0;
  padding:15px;
  background: #f8f8f8;
  border-radius:8px;
  border: 1px solid #e0e0e0;
}

.settings-panel h3 {
  mardin-top: 0;
  color: #333;
  border-bottom:1px solid #ddd;
  padding-bottom: 10px;
}

.settings-buttons {
  display: flex;
  gap:4px;
  margin-top: 12px;
}

.settings-control-button, .settings-cancel-button, .settings-reset-button {
  padding: 8px 12px;
  font-weight:normal;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  flex: 1;
}

.settings-control-button {
  margin-right: 3px;
  background: #2ecc71;
}

.settings-cancel-button {
  margin-right:3px;
  background: #f39c12;
}

.settings-reset-button {
  background: #e74c3c;
}

.settings-control-button:hover, .settings-cancel-button:hover, .settings-reset-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.setting-item {
  margin-bottom:15px;
}

.setting-item label {
  display: block;
  margin-bottom: 5px;
  font-size:14px;
  color: #555;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width:18px;
  height:18px;
  border-radius:50%;
  background:#3498db;
  cursor:pointer;
}

.setting-label-with-icon {
  display:flex;
  align-items:center;
  gap:8px;
  justify-content:space-between;
}

.settings-icon-button {
  background: none;
  border: 1px colid #ccc;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  font-size:14px;
  color: #666;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  display: flex;
  align-items:center;
  justify-content:center;
  width:28px;
  height:28px;
}

.settings-icon-button:hover {
  background: #eaeaea;
  border-color: #bbb;
  transform: scale(1.05);
}

.mini-settings-panel {
  background:#f4f4f4;
  border: 1px solid #ddd;
  padding:10px;
  margin-top:10px;
  border-radius:8px;
}

.mini-setting-item {
  mardin-bottom: 10px;
}

.mini-setting-item label {
  display:block;
  margin-bottom:5px;
  font-size:13px;
  color:#555;
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

.simulation-end {
  margin:25 px auto;
  max-width: 500px;
  animation: fadeInUp 0.6s ease-out;
}

.end-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
}

.end-card.win {
  border-top: 4px solid #2ecc71;
}

.end-card.loss {
  border-top: 4px solid #e74c3c;
}

.end-icon {
  background: rgba(0,0,0,0.05);
  padding: 25px;
  display: flex;
  align-items: center;
  font-size: 2.5rem;
}

.end-content {
  padding:20px;
  flex-grow: 1;
}

end-content h3 {
  mardin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.outcome-message {
  margin: 0 0 15px 0;
  line-height: 1.5;
  font-size: 1.1rem;
}

.outcome-message small {
  opacity: 0.8;
  font-size: 0.9rem;
}

.time-stats {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  font-size: 0.95rem;
}

.time-icon {
  margin-right: 8px;
  font-size: 1.1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 5; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>