//Класс медика
export class Medic {
    //Конструктор класса
    constructor(x, y, speed = 1.2, healingPower = 2, detectionRadius = 150, infectionTime = 6000) {
        this.x = x || Math.random() * 700 + 50;         //Позиция X
        this.y = y || Math.random() * 500 + 50;         //Позиция Y
        this.speed = speed;                             //Скорость передвижения
        this.healingPower = healingPower;               //Сила лечения(на сколько уменьшается заражение)
        this.detectionRadius = detectionRadius;         //Радиус обнаружения зараженных/зомби
        this.infectionTime = infectionTime;             //Время полного заражения в мс
        this.radius = 6;                                //Радиус для отрисовки
        this.color = 'hsl(165, 80%, 60%)';            //Цвет - голубовато-зелёный
        this.currentTarget = null;                      //Текущая цель для лечения
        this.direction = Math.random() * Math.PI * 2;   //Направление движения
        this.infectionProgress = 0;                     //Прогресс заражения
        this.isHealing = false;                         //Флаг,лечит ли сейчас медик
        this.panicMode = false;                         //Флаг режима паники
        this.panicTimer = 0;                            //Таймер режима паники
        this.lastThreatPos = null;                      //Последняя известная позиция угрозы
    }

    // Основной метод движения медика
    move(humans, zombies, medics) {
        // Если медик уже заражен - используем специальное поведение
        if(this.infectionProgress > 0) {
            this.moveInfected(medics);
            return;
        }

        // Находим ближайшего зомби
        const nearestZombie = this.findClosestZombie(zombies);

        // Если зомби рядом - убегаем от него
        if (nearestZombie && this.isZombieNear(nearestZombie)) {
            this.runFrom(nearestZombie);
            this.panicMode = true;
            this.panicTimer = 60;

            // Сбрасываем текущую цель лечения
            if (this.currentTarget) {
                this.currentTarget.isHealing = false;
                this.currentTarget = null;
                this.isHealing = false;
            }
            return;
        }

        // Если таймер паники еще активен - продолжаем движение в панике
        if(this.panicTimer > 0) {
            this.panicTimer--;
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            this.applyBoundaries();
            return;
        }

        // Выходим из режима паники
        this.panicMode = false;

        // Фильтруем зараженных людей и медиков
        const infectedHumans = humans.filter(h => h.infectionProgress > 0 && h.infectionProgress < 100);
        const infectedMedics = medics.filter(m => m.infectionProgress > 0 && m.infectionProgress < 100);
        const infected = this.findClosestInfected([...infectedHumans, ...infectedMedics]);

        // Если есть зараженные для лечения
        if(infected) {
            // Если зараженный в радиусе обнаружения - идем к нему
            if(this.distanceTo(infected) < this.detectionRadius) {
                this.currentTarget = infected;
                this.goTo(this.currentTarget);
            } else {
                // Иначе - случайное блуждание
                this.randomWalk();
            }

            // Если достигли зараженного - начинаем лечение
            if(this.distanceTo(infected) < this.radius + infected.radius + 3) {
                this.isHealing = true;
                this.heal(infected);
            } else {
                // Если не достигли - прекращаем лечение
                this.isHealing = false;
                if(this.currentTarget) this.currentTarget.isHealing = false;
            }
        } else {
            // Если нет целей для лечения - случайное блуждание
            this.isHealing = false;
            if (this.currentTarget) {
                this.currentTarget.isHealing = false;
                this.currentTarget = null;
            }
            this.randomWalk();
        }
    }

    // Проверка, находится ли зомби рядом
    isZombieNear(zombie) {
        return Math.hypot(this.x - zombie.x, this.y - zombie.y) < this.detectionRadius;
    }

    // Метод лечения зараженного
    heal(human) {
        // Уменьшаем прогресс заражения (но не меньше 0)
        human.infectionProgress = Math.max(0, human.infectionProgress - this.healingPower);
        human.isHealing = true;

        // Если полностью вылечили - сбрасываем флаги
        if(human.infectionProgress === 0) {
            human.infected = false;
            human.isHealing = false;
            if(this.currentTarget) {
                this.currentTarget = null;
            }
        }
    }

    // Метод движения к цели
    goTo(infected) {
        // Плавное изменение направления
        const targetDir = Math.atan2(infected.y - this.y, infected.x - this.x);
        
        // Если направление не определено - устанавливаем сразу
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

        // Движение в выбранном направлении
        this.x += Math.cos(this.direction) * speed;
        this.y += Math.sin(this.direction) * speed;

        // Избегание стен
        this.avoidWalls(20);

        // Проверка границ игрового поля
        this.applyBoundaries();
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

    // Метод ограничения позиции в пределах игрового поля
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

    // Метод поиска ближайшей сущности
    findClosestEntity(entitys) {
        if(entitys.length === 0) return null;

        let closest = null;     
        let minDist = Infinity; // Минимальное расстояние

        for(const entity of entitys) {
            // Расчет расстояния до медика
            const dist = this.distanceTo(entity);

            if(dist < minDist) {
                minDist = dist;
                closest = entity;
            }
        }
        return closest;
    }

    // Метод поиска ближайшего зараженного
    findClosestInfected(humans) {
         return this.findClosestEntity(humans);
    }

    // Метод поиска ближайшего зомби
    findClosestZombie(zombies) {
        return this.findClosestEntity(zombies);
    }

    // Метод расчета расстояния до сущности
    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
    }

    // Метод обновления состояния заражения
    updateInfection(deltaTime){
        // Увеличиваем прогресс заражения
        if(this.infectionProgress > 0){
            this.infectionProgress += deltaTime / this.infectionTime * 100;

            // Изменяем цвет в зависимости от прогресса заражения
            this.color = `hsl(${165 - (165 * this.infectionProgress/100)}, ${80 + (20 * this.infectionProgress/100)}%, ${60 - (30 * this.infectionProgress/100)}%)`;
        }
    }

    // Метод поиска ближайшего медика
    findClosestMedic(medics) {
        return this.findClosestEntity(medics);
    }

    // Метод движения зараженного медика
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

}