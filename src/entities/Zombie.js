//Класс Зомби
export class Zombie {
    // Конструктор класса с параметрами по умолчанию
    constructor(x, y, speed = 0.9, infectionRadius = 20, detectionRadius = 150, maxHealth = 5, attackPower = 1, attackRate = 60){
        // Позиция зомби
        this.x = x || Math.random() * 700 + 50;
        this.y = y || Math.random() * 500 + 50;
        this.radius = 7;// Радиус зомби для отрисовки
        this.direction = Math.random() * Math.PI * 2;// Направление движения (случайное)
        this.speed = speed;// Скорость передвижения
        this.detectionRadius = detectionRadius;// Радиус обнаружения людей
        this.infectionRadius = infectionRadius;// Радиус атаки/заражения
        this.color = 'hsl(0, 100%, 30%)';// Цвет зомби (темно-красный)

        // Система целей и таргетинга
        this.currentTarget = null;// Текущая цель (человек, медик или стражник)
        this.targetLockTimer = 0;// Таймер удержания цели

        // Параметры для случайного блуждания
        this.walkCucle = 0;// Цикл ходьбы
        this.walkangle = 0;// Угол для случайного блуждания

        // Параметры здоровья и атаки
        this.maxHealth = maxHealth;// Максимальное здоровье
        this.health = maxHealth;// Текущее здоровье
        this.attackPower = attackPower;// Сила атаки
        this.attackCooldown = 0;// Время перезарядки атаки
        this.attackRate = attackRate;// Частота атак (в кадрах)
    }

    // Основной метод движения зомби
    move(humans, medics, guardians) {
        // Если есть текущая цель и таймер удержания цели активен, и цель не заражена
        if(this.currentTarget && this.targetLockTimer > 0 && this.currentTarget.infectionProgress === 0) {
            this.targetLockTimer--; // Уменьшаем таймер удержания

            // Рассчитываем расстояние до цели
            const dist = this.distanceTo(this.currentTarget); 
            
            // Проверяем валидность цели (не заражена или жива) и что цель в радиусе обнаружения
            const isTargetValid = (this.currentTarget.infectionProgress === 0 || this.currentTarget.health > 0) && dist < this.detectionRadius;

            if(isTargetValid) {
                // Если у цели есть здоровье и мы в радиусе атаки - атакуем
                if(this.currentTarget.health !== undefined && dist < this.infectionRadius) {
                    this.attack(this.currentTarget);
                }
                // Иначе если цель может быть заражена - преследуем
                else if (this.currentTarget.infectionProgress !== undefined) {
                    this.chase(this.currentTarget);
                }
                return; // Выходим из метода
            }
        }
        // Собираем всех доступных для атаки людей (незараженные люди, медики и живые стражи)
        const allHumans = [...humans.filter(h => h.infectionProgress === 0), ...medics.filter(m => m.infectionProgress === 0), ...guardians.filter(g => g.health > 0)];
        // Находим ближайшего человека
        const closestHuman = this.findClosestHuman(allHumans);

        // Если нашли ближайшего человека и он рядом
        if (closestHuman && this.isHumanNear(closestHuman)) {
            // Устанавливаем его как цель
            this.currentTarget = closestHuman;
            this.targetLockTimer = 100; // Устанавливаем таймер удержания цели

            // Если у цели есть здоровье и мы в радиусе атаки - атакуем
            if(closestHuman.health !== undefined && this.distanceTo(closestHuman) < this.infectionRadius) {
                this.attack(closestHuman);
            } else {
                // Иначе преследуем цель
                this.chase(closestHuman); 
            }
        } else {
            // Если нет целей поблизости - случайное блуждание
            this.randomWalk()
            this.currentTarget = null; // Сбрасываем текущую цель
        }

        // Уменьшаем время перезарядки атаки, если оно активно
        if(this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    // Проверка, находится ли человек рядом (в радиусе обнаружения)
    isHumanNear(human) {
        return this.distanceTo(human) < this.detectionRadius;
    }

    // Метод преследования цели
    chase(human){
        // Предсказание движения цели (преследование с упреждением)
        const prediction = 10;
        const humanFutureX = human.x + Math.cos(human.direction) * prediction;
        const humanFutureY = human.y + Math.sin(human.direction) * prediction;

        // Устанавливаем направление движения к предсказанной позиции цели
        this.direction = Math.atan2(humanFutureY - this.y, humanFutureX-this.x);

        // Двигаемся в направлении цели
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        this.applyBoundaries(); // Проверяем границы игрового поля
    }

    // Метод атаки цели
    attack(target) {
        // Если атака не на перезарядке и у цели есть здоровье
        if(this.attackCooldown <= 0 && target.health !== undefined) {
            target.health -= this.attackPower; // Наносим урон
            this.attackCooldown = this.attackRate; // Устанавливаем перезарядку

            // Если цель умерла - сбрасываем текущую цель
            if(target.health <= 0) {
                this.currentTarget = null;
            }
        }
    }

    // Метод случайного блуждания
    randomWalk(){
        // Если цикл ходьбы закончился - выбираем новое случайное направление
        if(this.walkCucle <= 0) {
            this.walkangle = Math.random() * Math.PI * 2;
            this.walkCucle = 50 + Math.random() * 50; // Устанавливаем новый цикл
        }

        this.walkCucle--; // Уменьшаем цикл ходьбы

        // Плавно меняем направление к walkangle
        const angleDiff = this.walkangle - this.direction;
        this.direction += angleDiff * 0.05;

        // Двигаемся с небольшой случайной вариацией скорости
        const currentSpeed = this.speed * (0.3 + Math.random() * 0.2);
        this.x += Math.cos(this.direction) * currentSpeed;
        this.y += Math.sin(this.direction) * currentSpeed;

        // Если достигли границы по X - меняем направление
        if(this.x <= 10 || this.x >= 790) {
            this.walkangle = Math.PI - this.direction;
            this.walkCucle = 30;
        }
        // Если достигли границы по Y - меняем направление
        if (this.y <= 10 || this.y >= 590) {
            this.walkangle = -this.direction;
            this.walkCucle = 30;
        }

        this.applyBoundaries(); // Проверяем границы
    }

    // Метод ограничения позиции в пределах игрового поля
    applyBoundaries() {
        this.x = Math.max(10, Math.min(790, this.x));
        this.y = Math.max(10, Math.min(590, this.y));
    }

    // Метод поиска ближайшего человека из списка
    findClosestHuman(humans) {
        if(humans.length === 0) return null; // Если список пуст - возвращаем null

        // Используем reduce для поиска человека с минимальным расстоянием
        return humans.reduce((closest, human) => {
            const dist = this.distanceTo(human)
            return dist < closest.dist ? { human, dist } : closest
          }, { human: null, dist: Infinity }).human;
    }

    // Метод расчета расстояния до сущности
    distanceTo(entity) {
        return Math.hypot(this.x - entity.x, this.y - entity.y);
    }
}