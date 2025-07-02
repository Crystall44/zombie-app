// Класс, представляющий человека в симуляции
export class Human {
    // Конструктор класса Human
    constructor(x, y, speed = 1.0, infectionTime = 3000, detectionRadius = 100) {
        this.x = x;             // Координата X положения человека
        this.y = y;             // Координата Y положения человека
        this.radius = 5;        // Радиус человека (для отрисовки)
        this.speed = speed;     // Скорость перемещения
        this.infected = false;  // Флаг заражения (зомби-вирусом)
        this.color = 'hsl(25, 60%, 70%)';   // Цвет для отрисовки (телесный)
        this.detectionRadius = detectionRadius;// Радиус обнаружения зомби
        this.panicMode = false; // Режим паники (убегания от зомби)
        this.infectionProgress = 0; // Прогресс заражения (0-100%)
        this.infectionTime = infectionTime; // Время полного заражения (в мс)
        this.direction = Math.random() * Math.PI * 2;   // Направление движения (случайное)
        this.panicTimer = 0;    // Таймер панического поведения
        this.lastThreatPos = null;  // Последняя известная позиция угрозы
        this.isHealing = false; // Флаг процесса лечения
    }

    // Метод перемещения человека
    move(zombies, medics) {
        // Если человек в процессе лечения - не двигается
        if(this.isHealing) return;

        // Если есть прогресс заражения - особое поведение зараженного
        if(this.infectionProgress > 0) {
            this.moveInfected(medics);
            return
        }
        // Поиск ближайшего зомби среди всех зомби
        const closestZombie = this.findClosestZombie(zombies);

        // Проверка, находится ли зомби достаточно близко
        if(closestZombie && this.isZombieNear(closestZombie)) {
            // Убегание от зомби
            this.runFrom(closestZombie);
            this.panicMode = true; // Включение режима паники
        } else {
            // Если таймер паники еще активен - продолжать движение в панике
            if (this.panicTimer > 0) {
                this.panicTimer--;
                this.x += Math.cos(this.direction) * this.speed;
                this.y += Math.sin(this.direction) * this.speed;
                this.applyBoundaries();
                return;
            }
            // Обычное случайное блуждание
            this.randomWalk();
            this.panicMode = false; // Выключение режима паники
        }
    }

    // Проверка, находится ли зомби достаточно близко
    isZombieNear(zombie) {
        // Расчет расстояния до зомби
        return this.distanceTo(zombie) < this.detectionRadius;
    }

    // Метод убегания от зомби
    runFrom(zombie) {
        // Расчет угла направления от зомби
        const angle = Math.atan2(this.y - zombie.y, this.x - zombie.x);
        this.direction = angle + (Math.random() - 0.5) * (Math.PI/3);
        // Избегание стен с большим запасом (20px)
        this.avoidWalls(20);

        // Движение в выбранном направлении
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Проверка границ игрового поля
        this.applyBoundaries();

        // Запоминаем позицию угрозы
        this.lastThreatPos = {x: zombie.x, y:zombie.y};
        this.panicTimer = 60;// Устанавливаем таймер паники
    }

    // Метод случайного блуждания
    randomWalk() {
        // 0.5% шанс изменить направление в случайную сторону
        if(Math.random() < 0.005 || !this.direction) {
            this.direction = Math.random() * Math.PI * 2;
        }

        // Добавляем небольшие случайные отклонения в направлении
        this.direction += (Math.random() - 0.5) * 0.15;

        // Движение в выбранном направлении
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Избегание стен с небольшим запасом (5px)
        this.avoidWalls(5);

        // Проверка границ игрового поля
        this.applyBoundaries();
    }

    // Метод движения зараженного человека
    moveInfected(medics) {
        // Проверка, что заражение в процессе
        if(this.infectionProgress > 0 && this.infectionProgress < 100) {
            // Поиск доступных медиков (не зараженных)
            const availableMedics = medics.filter(m => 
                m.infectionProgress === 0
            );

            // Поиск ближайшего медика
            const closestMedic = this.findClosestMedic(availableMedics);

            // Если медик найден и не в панике
            if(closestMedic && !closestMedic.panicMode) {
                // Расчет расстояния до медика
                const distToMedic = this.distanceTo(closestMedic);

                // Если медик достаточно близко
                if(distToMedic < this.detectionRadius * 2) {
                    // Расчет направления к медику
                    const angle = Math.atan2(closestMedic.y - this.y, closestMedic.x - this.x);
                    this.direction = angle + (Math.random() - 0.5) * 0.1;

                    // Движение к медику
                    this.x += Math.cos(this.direction) * this.speed;
                    this.y += Math.sin(this.direction) * this.speed;
                    this.applyBoundaries();
                    return;
                }
            }
            // Если медиков нет или они далеко - случайное блуждание
            this.randomWalk();
        }
    }

    // Метод поиска ближайшего медика
    findClosestMedic(medics) {
        // Если медиков нет - возвращаем null
        if(medics.length === 0) return null;

        let closest = null;     // Ближайший медик
        let minDist = Infinity; // Минимальное расстояние

        // Перебираем всех медиков
        for(const medic of medics) {
            // Расчет расстояния до медика
            const dist = this.distanceTo(medic);

            // Если медик ближе предыдущего ближайшего
            if(dist < minDist) {
                minDist = dist;
                closest = medic;
            }
        }
        return closest;
    }

    // Метод ограничения движения границами поля
    applyBoundaries() {
        this.x = Math.max(10, Math.min(790, this.x));
        this.y = Math.max(10, Math.min(590, this.y));
    }

    // Метод избегания стен
    avoidWalls(margin) {
        // Расчет следующей позиции с учетом запаса
        const nextX = this.x + Math.cos(this.direction) * margin;
        const nextY = this.y + Math.sin(this.direction) * margin;

        // Проверка левой/правой границы
        if(nextX < 10 || nextX > 790) {
            if(!this.panicMode) {
                // В обычном режиме - отражение от стен
                this.direction = Math.atan2(Math.sin(this.direction), -Math.cos(this.direction));
            } else {
                // В режиме паники - резкий поворот
                this.direction = nextY < this.y ? -Math.PI/2 : Math.PI/2;
            }
        }
        // Проверка верхней/нижней границы
        else if (nextY < 10 || nextY > 590) {
            if(!this.panicMode) {
                // В обычном режиме - отражение от стен
                this.direction = Math.atan2(-Math.sin(this.direction), Math.cos(this.direction));
            }
            else {
                // В режиме паники - резкий поворот
                this.direction = nextX < this.x ? Math.PI : 0;
            }
        }
    }

    // Метод поиска ближайшего зомби
    findClosestZombie(zombies) {
        // Если зомби нет - возвращаем null
        if(zombies.length === 0) return null;

        let closest = null;     // Ближайший зомби
        let minDist = Infinity; // Минимальное расстояние

        // Перебираем всех зомби
        for(const zombie of zombies) {
             // Расчет расстояния до зомби
            const dist = this.distanceTo(zombie);

            // Если зомби ближе предыдущего ближайшего
            if(dist < minDist) {
                minDist = dist;
                closest = zombie;
            }
        }
        return closest;
    }

    // Метод обновления состояния заражения
    updateInfection(deltaTime){
        // Если заражение началось
        if(this.infectionProgress > 0){
            // Увеличение прогресса заражения
            this.infectionProgress += deltaTime / this.infectionTime * 100;

            // Изменение цвета в зависимости от прогресса заражения
            this.color = `hsl(${25 - (25 * this.infectionProgress/100)}, ${60 + (40 * this.infectionProgress/100)}%, ${70 - (40 * this.infectionProgress/100)}%)`;
        }
    }

    // Метод проверки близости к точке
    isTooClose(x, y, minDist) {
        return Math.hypot(this.x - x, this.y - y) < minDist;
    }

    // Метод расчета расстояния до объекта
    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
    }
}