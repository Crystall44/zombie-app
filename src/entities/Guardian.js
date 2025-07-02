// Класс, представляющий охранника/защитника в симуляции
export class Guardian {
    //Конструктор класса
    constructor(x, y, speed = 0.6, detectionRadius = 100, attackRadius = 50, attackPower = 1, attackRate = 60, maxHealth = 3) {
        this.x = x || Math.random() * 700 + 50;     // Координата X положения охранника
        this.y = y || Math.random() * 500 + 50;     // Координата Y положения охранника
        this.detectionRadius = detectionRadius;     // Радиус обнаружения зомби
        this.speed = speed;                         // Скорость перемещения
        this.radius = 7;                            // Размер охранника (для отрисовки)
        this.color = 'hsl(225, 85%, 40%)';        // Цвет охранника (синий)
        this.direction = Math.random() * Math.PI * 2;   // Начальное направление движения
        this.currentTarget = null;                  // Текущая цель для атаки

        // Параметры здоровья и атаки
        this.attackPower = attackPower;             // Сила атаки
        this.attackCooldown = 0;                    // Время до следующей атаки
        this.attackRate = attackRate;               // Частота атак (в кадрах)
        this.attackRadius = attackRadius;           // Радиус атаки
        this.maxHealth = maxHealth;                 // Максимальное здоровье
        this.health = maxHealth;                    // Текущее здоровье
    }

    // Основной метод движения охранника
    move(zombies) {
        // Если нет текущей цели или цель мертва - ищем новую
        if(!this.currentTarget || this.currentTarget.health <= 0) {
            this.currentTarget = this.findClosestZombie(zombies.filter(z => z.health > 0));
        }

        // Если есть цель
        if(this.currentTarget) {
            const dist = this.distanceTo(this.currentTarget);

            // Если цель в радиусе атаки - атакуем
            if(dist < this.attackRadius) {
                this.attack(this.currentTarget);
            }
            // Если цель в радиусе обнаружения - преследуем
            else if(dist < this.detectionRadius) {
                this.chase(this.currentTarget);
            }
            // Если цель слишком далеко - теряем её и бродим случайно
            else {
                this.currentTarget = null;
                this.randomWalk();
            }
        } else {
            // Если цели нет - бродим случайно
            this.randomWalk();
        }

        // Уменьшаем время перезарядки атаки
        if(this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        // Проверяем границы игрового поля
        this.applyBoundaries();
    }

    // Метод атаки
    attack(zombie) {
        // Если атака не на перезарядке
        if(this.attackCooldown <= 0) {
            zombie.health -= this.attackPower;      // Наносим урон
            this.attackCooldown = this.attackRate;  // Устанавливаем перезарядку

            // Если зомби умер - сбрасываем цель
            if(zombie.health <= 0) {
                this.currentTarget = null;
            }
        }
    }

    // Метод преследования цели
    chase(zombie) {
        // Расчет направления к цели
        this.direction = Math.atan2(zombie.y - this.y, zombie.x - this.x);

        // Движение в направлении цели
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Проверка границ
        this.applyBoundaries();
    }

    // Метод случайного блуждания
    randomWalk() {
        // С шансом 0.5% или если направление не задано - выбираем новое случайное направление
        if(Math.random() < 0.005 || !this.direction) {
            this.direction = Math.random() * Math.PI * 2;
        }

        // Добавляем небольшие случайные отклонения в направлении
        this.direction += (Math.random() - 0.5) * 0.15;

        // Движение в текущем направлении
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Избегаем столкновений со стенами
        this.avoidWalls(5);

        // Проверка границ
        this.applyBoundaries();
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

    // Метод расчета расстояния до объекта
    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
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
            this.direction = Math.atan2(Math.sin(this.direction), -Math.cos(this.direction));
        }
        // Проверка верхней/нижней границы
        else if (nextY < 10 || nextY > 590) {
            this.direction = Math.atan2(-Math.sin(this.direction), Math.cos(this.direction));
        }
    }
}