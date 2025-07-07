<script>
// Импорт классов сущностей из соответствующих файлов
import {Zombie} from './entities/Zombie.js'
import {Human} from './entities/Human.js'
import {Medic} from './entities/Medic.js'
import {Guardian} from './entities/Guardian.js'
  export default{
    data() {
      // Настройки по умолчанию для симуляции
      const defaultSettings = {
          population: 100,              // Общее количество людей
          humanSpeed: 1.0,              // Скорость передвижения людей
          zombieSpeed: 0.9,             // Скорость передвижения зомби
          detectionRadiusHumans: 100,   // Радиус обнаружения для людей
          infectionRadius: 25,          // Радиус заражения
          infectionTime: 3000,          // Время заражения (мс)
          zombiePopulation: 1,          // Начальное количество зомби
          medicSpeed: 1.2,              // Скорость медиков
          healingPower: 2,              // Сила лечения
          detectionRadiusMedic: 150,    // Радиус обнаружения для медиков
          infectionTimeMedic: 6000,     // Время заражения для медиков
          guardianSpeed: 0.6,           // Скорость защитников
          detectionRadiusGuardian: 100, // Радиус обнаружения для защитников
          attackRadiusGuardian: 50,     // Радиус атаки защитников
          medicsPopulation: 5,          // Количество медиков
          guardiansPopulation: 5,       // Количество защитников
          detectionRadiusZombie: 150,   // Радиус обнаружения для зомби
          maxHealthZombie: 5,           // Максимальное здоровье зомби
          attackPowerZombie: 1,         // Сила атаки зомби
          attackRateZombie: 60,         // Частота атак зомби
          attackPowerGuardian: 1,       // Сила атаки защитников
          attackRateGuardian: 60,       // Частота атак защитников
          maxHealthGuardian: 3          // Максимальное здоровье защитников
        };
      return {
        humans: [],     // Массив для хранения людей
        zombies: [],    // Массив для хранения зомби
        medics: [],     // Массив для хранения медиков
        guardians: [],  // Массив для хранения защитников
        ctx: null,      // Контекст canvas для отрисовки
        animationId: null,          // ID анимации
        showHumanSettings: false,   // Флаг показа настроек людей
        showZombieSettings: false,  // Флаг показа настроек зомби
        showMedicSettings: false,   // Флаг показа настроек медиков
        showGuardianSettings: false,// Флаг показа настроек защитников
        startTime: 0,       // Время начала симуляции
        elapsedTime: 0,     // Прошедшее время симуляции
        pauseTime: 0,       // Время паузы
        lastPauseTime: 0,   // Время последней паузы
        lastTime: 0,        // Последнее зафиксированное время
        stats: {            // Статистика симуляции
          healthy: 0,       // Количество здоровых
          infected: 0,      // Количество зараженных
          zombies: 0,       // Количество зомби
          medics: 0,        // Количество медиков
          guardians: 0,     // Количество защитников
          time: '00:00'     // Время симуляции
        },
        simulationEnd: false,   // Флаг окончания симуляции
        minDist: 100,           // Минимальное расстояние
        isRunning: false,       // Флаг работы симуляции
        isPaused:false,         // Флаг паузы
        simulationStarted: false, // Флаг начала симуляции
        showSettings:true,      // Флаг показа настроек
        tempSettings: null,     // Временные настройки
        settings: JSON.parse(JSON.stringify(defaultSettings)),  // Текущие настройки
        defaultSettings,         // Настройки по умолчанию
        frameSkip: 0             // Для уменьшения количества кадров в 2 раза
      }
    },
    
    // Хук, вызываемый после монтирования компонента
    mounted() {
      this.initWorld(); // Инициализация мира
    },

    // Вычисляемые свойства
    computed: {
      // Текст для главной кнопки управления
      mainButtonText() {
        if(this.simulationEnd) return 'Начать заново';
        if(this.isPaused) return 'Продолжить';
        return this.isRunning ? 'Остановить' : 'Начать симуляцию';
      }
    },

    methods: {
          // Обработчик клика по кнопке управления
          handleControlClick() {
            if(this.isRunning) {
              this.stopSim();     // Остановить симуляцию
              this.isRunning = false;
              this.isPaused = true;
            } else {
              this.startSim();    // Запустить симуляцию
              this.isRunning = true;
              this.isPaused = false;
            }
          },

          // Инициализация игрового мира
          initWorld() {
            // Получаем контекст canvas для рисования
            this.ctx = this.$refs.canvas.getContext('2d');

            // Очищаем массивы сущностей
            this.humans = [];
            this.zombies = [];
            this.medics = [];
            this.guardians = [];

            // Создание людей с случайными позициями
            for(let i = 0; i < this.settings.population; i++) {
              const human = new Human(Math.random() * 700 + 50, Math.random() * 500 + 50,this.settings.humanSpeed, this.settings.infectionTime, this.settings.detectionRadiusHumans);
              this.humans.push(human);
            }

            // Создание медиков
            for(let i = 0; i < this.settings.medicsPopulation; i++) {
              const medic = new Medic(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.medicSpeed, this.settings.healingPower, this.settings.detectionRadiusMedic, this.settings.infectionTimeMedic);
              this.medics.push(medic);
            }

            // Создание защитников
            for(let i = 0; i < this.settings.guardiansPopulation; i++) {
              const guardian = new Guardian(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.guardianSpeed, this.settings.detectionRadiusGuardian, this.settings.attackRadiusGuardian, this.settings.attackPowerGuardian, this.settings.attackRateGuardian, this.settings.maxHealthGuardian);
              this.guardians.push(guardian);
            }

            // Создание зомби с учетом минимального расстояния от людей
            for(let i = 0; i < this.settings.zombiePopulation; i++) {
              this.spawnZombie(50);
            }

            // Запоминаем текущее время и рисуем мир
            this.lastTime = performance.now();
            this.drawWorld();
          },

          // Метод создания нового зомби с проверкой минимального расстояния от людей
          spawnZombie(minDist) {
            let attempts = 0;
            const maxAttempts = 50; // Максимальное количество попыток

            // Пытаемся найти позицию, не слишком близкую к людям
            while (attempts < maxAttempts) {
              const x = Math.random() * 700 + 50;
              const y = Math.random() * 500 + 50;

              // Проверяем, не слишком ли близко к людям
              const tooClose = this.humans.some(human => human.isTooClose(x, y, minDist));
              if(!tooClose) {
                // Создаем зомби, если нашли подходящую позицию
                const zombie = new Zombie(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.zombieSpeed, this.settings.infectionRadius, this.settings.detectionRadiusZombie, this.settings.maxHealthZombie, this.settings.attackPowerZombie, this.settings.attackRateZombie);
                this.zombies.push(zombie);
                return;
              }

              attempts++;
            }

            // Если не нашли подходящую позицию, создаем зомби в случайном месте
            const zombie = new Zombie(Math.random() * 700 + 50, Math.random() * 500 + 50, this.settings.zombieSpeed, this.settings.infectionRadius, this.settings.detectionRadiusZombie, this.settings.maxHealthZombie, this.settings.attackPowerZombie, this.settings.attackRateZombie);
            this.zombies.push(zombie);
            return;
          },

          // Отрисовка игрового мира
          drawWorld() {
            // Очищаем canvas
            this.ctx.clearRect(0,0,800,600);

            //Рисование людей
            this.humans.forEach(human => {
              // Основной круг человека
              this.ctx.fillStyle = human.color;
              this.ctx.beginPath();
              this.ctx.arc(human.x, human.y, human.radius, 0, Math.PI * 2);
              this.ctx.fill();

              // Индикатор заражения (если человек заражен)
              if(human.infectionProgress > 0) {
                this.ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(human.x, human.y, human.radius + 3, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * human.infectionProgress/100);
                this.ctx.stroke();
              }
            })

            // Рисуем медиков
             this.medics.forEach(medic => {
              // Основной круг медика
              this.ctx.fillStyle = medic.color;
              this.ctx.beginPath();
              this.ctx.arc(medic.x, medic.y, medic.radius, 0, Math.PI*2);
              this.ctx.fill();

              // Индикатор заражения (если медик заражен)
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

              // Анимация лечения (пульсирующий круг)
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

              // Рисуем защитников
              this.guardians.forEach(guardian => {
                // Основной круг защитника
                this.ctx.save();
                this.ctx.fillStyle = guardian.color;
                this.ctx.beginPath();
                this.ctx.arc(guardian.x, guardian.y, guardian.radius, 0, Math.PI*2);
                this.ctx.fill();

                // Металлический ободок (визуальный эффект брони)
                this.ctx.strokeStyle = 'hsla(200, 30%, 80%, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(guardian.x, guardian.y, guardian.radius + 1, 0, Math.PI*2);
                this.ctx.stroke();

                // Область атаки (полупрозрачный круг)
                this.ctx.fillStyle = 'rgba(80, 60, 160, 0.08)';
                this.ctx.beginPath();
                this.ctx.arc(guardian.x, guardian.y, guardian.attackRadius, 0, Math.PI * 2);
                this.ctx.fill();

                // Отображение здоровья, если оно не полное
                if(guardian.health < guardian.maxHealth) {
                const healthWidth = 20;
                const healthHeight = 3;
                const healthX = guardian.x - healthWidth/2;
                const healthY = guardian.y - guardian.radius - 5;

                // Фон полоски здоровья
                this.ctx.fillStyle = "rgba(0,0,0,0.5)";
                this.ctx.fillRect(healthX, healthY, healthWidth, healthHeight);

                // Сама полоска здоровья (меняет цвет в зависимости от уровня)
                const hpPercent = guardian.health / guardian.maxHealth;
                this.ctx.fillStyle = hpPercent > 0.6 ? '#2ecc71' : hpPercent > 0.3 ? '#f39c12' : '#e74c3c';
                this.ctx.fillRect(healthX, healthY, healthWidth * hpPercent, healthHeight);
                this.ctx.restore();
              }
              })

            //Рисование Зомби
            this.zombies.forEach(zombie => {
              this.ctx.save(); // Сохраняем текущее состояние контекста

              // Основной круг зомби
              this.ctx.fillStyle = zombie.color
              this.ctx.beginPath()
              this.ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2)
              this.ctx.fill()

              // Отображение здоровья, если оно не полное
              if(zombie.health < zombie.maxHealth) {
                const healthWidth = 20;
                const healthHeight = 3;
                const healthX = zombie.x - healthWidth/2;
                const healthY = zombie.y - zombie.radius - 5;

                // Фон полоски здоровья
                this.ctx.fillStyle = "rgba(0,0,0,0.5)";
                this.ctx.fillRect(healthX, healthY, healthWidth, healthHeight);

                // Сама полоска здоровья (меняет цвет в зависимости от уровня)
                const hpPercent = zombie.health / zombie.maxHealth;
                this.ctx.fillStyle = hpPercent > 0.6 ? '#2ecc71' : hpPercent > 0.3 ? '#f39c12' : '#e74c3c';
                this.ctx.fillRect(healthX, healthY, healthWidth * hpPercent, healthHeight);
              }

              // Отображение зоны заражения (полупрозрачный красный круг)
              this.ctx.fillStyle = 'rgba(139, 0, 0, 0.1)';
              this.ctx.beginPath();
              this.ctx.arc(zombie.x, zombie.y, zombie.infectionRadius, 0, Math.PI * 2);
              this.ctx.fill();

              // Восстанавливаем состояние контекста
              this.ctx.restore();
            })

            // Обновление статистики
            this.updateStats();
          },

          // Сохранение настроек
          saveSettings() {
            this.tempSettings = JSON.parse(JSON.stringify(this.settings));  // Сохраняем текущие настройки
            this.showSettings = false;  // Скрываем панель настроек
            this.initWorld(); // Перезапускаем мир с новыми настройками
          },

          // Отмена изменений настроек
          cancelSettings() {
            // Восстанавливаем предыдущие настройки
            if (this.tempSettings) {
              this.settings = JSON.parse(JSON.stringify(this.tempSettings));
              this.$nextTick(() => {
              this.$forceUpdate(); // Принудительное обновление компонента
            })
            }

            this.showSettings = true; // Показываем панель настроек
          },

          // Сброс настроек к значениям по умолчанию
          resetSettings() {
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));

            this.$nextTick(() =>{
              this.$forceUpdate();  // Принудительное обновление компонента
              this.initWorld();     // Перезапускаем мир
            })
          },

          // Запуск симуляции
          startSim() {
            if(!this.simulationStarted) {
              // Первый запуск - инициализация времени
              this.startTime = performance.now();
              this.pauseTime = 0;
              this.elapsedTime = 0;
              this.simulationEnd = false;
              this.simulationStarted = true;
            } else {
              if(this.isPaused) {
                // Продолжение после паузы - корректировка времени
                this.pauseTime += performance.now() - this.lastPauseTime;
                this.isPaused = false;
              }
            }
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame(this.update); // Запуск игрового цикла
          },

          // Остановка симуляции
          stopSim() {
            cancelAnimationFrame(this.animationId); // Остановка анимации
            this.lastPauseTime = performance.now(); // Запоминаем время паузы
          },

          // Полный сброс симуляции
          resetSim() {
            this.stopSim(); // Останавливаем симуляцию

            // Сбрасываем все данные
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

            // Сбрасываем статистику
            this.stats = { healthy: 0, infected: 0, zombies: 0, medics: 0, guardians: 0, time: '00:00'};

            this.showSettings = true; // Показываем настройки
            this.initWorld();         // Инициализируем мир заново
          },

          // Основной игровой цикл обновления
          update(currentTime) {
            if(!this.isRunning) return;   // Если симуляция не запущена - выходим

            // Пропускаем каждый третий кадр
            this.frameSkip = (this.frameSkip + 1) % 3;
            if (this.frameSkip === 0) {
              this.animationId = requestAnimationFrame(this.update);
              return;
            }

            // Вычисляем время, прошедшее с предыдущего кадра
            const deltaTime = currentTime - this.lastTime
            this.lastTime = currentTime

            // Движение всех сущностей
            // Люди убегают от зомби
            this.humans.forEach(h => h.move(this.zombies, this.medics))
            // Зомби преследуют людей
            this.zombies.forEach(z => z.move(this.humans, this.medics, this.guardians))
            // Медики лечат людей
            this.medics.forEach(m => m.move(this.humans, this.zombies, this.medics))
            // Защитники атакуют зомби
            this.guardians.forEach(g => g.move(this.zombies))

            // Проверка заражения людей
            this.humans.forEach(human => {
              this.zombies.forEach(zombie =>{
                // Проверяем расстояние до зомби
                const dist = Math.hypot(zombie.x - human.x, zombie.y - human.y);
                if (dist < zombie.infectionRadius && human.infectionProgress === 0) {
                  human.infectionProgress = 0.1; // Начинаем заражение
                }
              })

              //Обновление прогресса заражения
              if(human.infectionProgress > 0){
                human.updateInfection(deltaTime)
              }
            })

            // Проверка заражения медиков (аналогично людям)
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

            // Превращение заражённых медиков в зомби
            this.medics = this.medics.filter(medic => {
              if (medic.infectionProgress >= 100) {
                // Создаем нового зомби на месте медика
                const zombie = new Zombie(medic.x, medic.y, this.settings.zombieSpeed, this.settings.infectionRadius);
                this.zombies.push(zombie);
                return false;      // Удаляем медика из массива
              }
              return true;
            })

            // Превращение заражённых людей в зомби
            this.humans = this.humans.filter(human => {
              if (human.infectionProgress >= 100) {
                const zombie = new Zombie(human.x, human.y, this.settings.zombieSpeed, this.settings.infectionRadius);
                this.zombies.push(zombie);
                return false;
              }
              return true;
            })

            // Удаление мертвых зомби
            this.zombies = this.zombies.filter(z => {
              if(z.health <= 0) {
                return false;
              }
              return true;
            })

            // Удаление мертвых защитников
            this.guardians = this.guardians.filter(g => {
              if(g.health <= 0) {
                return false;
              }
              return true;
            })

            // Обновление статистики
            this.updateStats()

            // Перерисовка мира
            this.drawWorld()

            // Проверка условий окончания игры
            if((this.humans.length > 0 || this.medics.length > 0) && (this.zombies.length > 0)) {
              // Продолжаем симуляцию, если есть и люди/медики, и зомби
              this.animationId = requestAnimationFrame(this.update)
            } else {
              // Завершаем симуляцию
              this.simulationEnd = true;
              this.isRunning = false;
              return;
            }
          },

          // Обновление статистики
          updateStats() {
            // Расчет прошедшего времени с учетом пауз
            if(this.simulationStarted && !this.isPaused){
              this.elapsedTime = performance.now() - this.startTime - this.pauseTime;
            }

            // Формирование объекта статистики
            this.stats = {
              healthy: this.humans.filter(h => h.infectionProgress === 0).length, // Здоровые люди
              infected: (this.humans.filter(h => h.infectionProgress > 0).length + this.medics.filter(m => m.infectionProgress > 0).length),  // Зараженные
              zombies: this.zombies.length, // Количество зомби
              medics: this.medics.filter(m => m.infectionProgress === 0).length,  // Здоровые медики
              guardians: this.guardians.filter(g => g.health > 0).length, // Живые защитники
              // Форматирование времени в MM:SS
              time: `${Math.floor((Math.floor(this.elapsedTime/1000))/60).toString().padStart(2, '0')}:${(Math.floor(this.elapsedTime/1000) % 60).toString().padStart(2, '0')}` 
            }
          },

          // Показать сообщение об окончании игры
          showEndMessage(message) {
            alert(message);
          },

          // Хук, вызываемый перед уничтожением компонента
          beforeDestroy() {
            cancelAnimationFrame(this.animationId)
          }
        }
      }
</script>

<template>
  <div class="simulation-container">
    <!-- Основной canvas для отрисовки симуляции -->
    <canvas ref="canvas" width="800" height="600" class="simulation-canvas"></canvas>
    <div class="controls-panel">
      <!-- Панель управления -->
      <div class="buttons-container">
      <!-- Главная кнопка управления (старт/пауза/стоп) -->
      <button v-if="!simulationEnd" @click="handleControlClick" :class="['control-button', {
        'stop-button': isRunning,
        'continue-button': isPaused && !simulationEnd,
        'start-button': !isRunning && !isPaused
        }]">{{ mainButtonText }}</button>

      <!-- Кнопка сброса симуляции -->
      <button 
        v-if="isPaused || simulationEnd"
        @click="resetSim"
        class="reset-button"
      >Начать заново</button>
      </div>

      <!-- Блок окончания симуляции -->
      <div v-if="simulationEnd" class="simulation-end">
        <!-- Иконка результата (победа/поражение) -->
        <div class="end-card" :class="{ 'win': zombies.length === 0, 'loss': zombies.length > 0 }">
          <div class="end-icon">
            <span v-if="zombies.length === 0">🎉</span>
            <span v-else>☠️</span>
          </div>
          <div class="end-content">
            <h3>{{ zombies.length === 0 ? 'Победа!' : 'Симуляция завершена'}}</h3>

            <!-- Различные сообщения в зависимости от исхода -->
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

            <!-- Блок с временем симуляции -->
            <div class="time-stats">
              <span class="time-icon">⏱️</span>
              Время симуляции: {{ stats.time }}
            </div>
          </div>
        </div>
      </div>

      <!-- Панель настроек (отображается перед началом симуляции) -->
      <div v-if="!simulationStarted" class="settings-panel">
        <div class="setting-item">
          <!-- Настройки людей -->
          <div class="setting-label-with-icon">
            <label>Количество людей: {{  settings.population  }}</label>
            <button @click="showHumanSettings = !showHumanSettings" class="settings-icon-button" title="Настройки">⚙️</button>
          </div>
          <input type="range" v-model.number="settings.population" min = "1" max = "300" step="1" class="slider">

          <!-- Дополнительные настройки людей -->
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

        <!-- Настройки зомби -->
        <div class="setting-item">
          <div class="setting-label-with-icon">
            <label>Количество зомби: {{  settings.zombiePopulation  }}</label>
            <button @click="showZombieSettings = !showZombieSettings" class="settings-icon-button" title="Настройки">⚙️</button>
          </div>
          <input type="range" v-model.number="settings.zombiePopulation" min = "1" max = "50" step="1" class="slider">

          <!-- Дополнительные настройки зомби -->
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

        <!-- Блок настроек медиков -->
        <div class="setting-item">
          <div class="setting-label-with-icon">
            <label>Количество медиков: {{  settings.medicsPopulation  }}</label>
            <button @click="showMedicSettings = !showMedicSettings" class="settings-icon-button" title="Настройки">⚙️</button>
          </div>
          <input type="range" v-model.number="settings.medicsPopulation" min = "0" max = "25" step = "1" class = "slider">

          <!-- Дополнительные настройки медиков -->
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
        
        <!-- Блок настроек защитников -->
        <div class="setting-item">
        <div class="setting-label-with-icon">
          <label>Количество защитников: {{ settings.guardiansPopulation }}</label>
          <button @click="showGuardianSettings = !showGuardianSettings" class="settings-icon-button" title="Настройки">⚙️</button>
        </div>
          <input type="range" v-model.number="settings.guardiansPopulation" min = "0" max = "25" step = "1" class = "slider">

          <!-- Дополнительные настройки защитников -->
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
              <label>Задержка между аттаками: {{  (settings.attackRateGuardian/60).toFixed(1)  }}</label>
              <input type="range" v-model.number="settings.attackRateGuardian" min = "30" max = "600" step = "30" class = "slider">
            </div>
            <div class="mini-settings-item">
              <label>Здоровье защитника: {{  settings.maxHealthGuardian  }}</label>
              <input type="range" v-model.number="settings.maxHealthGuardian" min = "1" max = "25" step = "1" class = "slider">
            </div>
          </div>
        </div>

        <!-- Кнопки управления настройками -->
        <div class="settings-button">
          <button @click="saveSettings" class="settings-control-button">Сохранить</button>
          <button @click="cancelSettings" class="settings-cancel-button">Отменить</button>
          <button @click="resetSettings" class="settings-reset-button">Сбросить</button>
        </div>
      </div>

      <!-- Блок статистики (отображается во время симуляции) -->
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
