🌐 Nombre del Proyecto: NEXUS 

NEXUS es una plataforma digital de educación y gestión financiera diseñada para jóvenes. Combina herramientas de seguimiento de gastos con dinámicas de gamificación y un entorno social colaborativo para fomentar el ahorro y la responsabilidad económica.

👥 Integrantes

- David Esteban Avila Rojas – 1202775 

- Juan Nicolás Lagos Fuquen – 1202737 

- David Felipe Alvarado Romero – 1202727 

🎯 1. Objetivo General
El proyecto busca diseñar y desarrollar una plataforma que facilite el aprendizaje práctico y la gestión financiera en jóvenes adultos, solucionando la falta de hábitos de ahorro y el conocimiento limitado sobre la organización del dinero. A través de la interacción social y la gamificación, el sistema permite que los usuarios transformen sus datos financieros en información comprensible para evitar problemas económicos derivados del uso indebido de sus ingresos.

🌍 2. Contexto de Uso

¿Quién lo usará?: Jóvenes adultos, específicamente estudiantes universitarios o personas en sus primeros años laborales con ingresos limitados o variables.


¿Cómo se usará?: Mediante sesiones breves y recurrentes en dispositivos de uso diario como celulares o computadoras.

📋 3. Requerimientos del Sistema

3.1 Requerimientos Funcionales (RF) 


- RF-01 al RF-03: Registro de usuarios, autenticación segura y privacidad de información personal.

- RF-04 al RF-08: Gestión financiera que incluye registro de ingresos/gastos, edición de transacciones, manejo de categorías y cálculo automático de balance.

- RF-09 al RF-13: Control de presupuestos mensuales, visualización de consumo, generación de reportes y gráficos de gastos con filtros de fecha.

RF-14 al RF-20: Componente social que permite gestionar amistades, crear metas de ahorro colaborativas, participar en retos de tiempo limitado y ganar experiencia (XP) por cumplimiento.


3.2 Requerimientos No Funcionales (RNF) 

- RNF-03: Usabilidad con una interfaz simple y de diseño responsive.

- RNF-04/05: Integridad en los cálculos y escalabilidad para soportar al menos 10,000 transacciones por usuario.

- RNF-06: Privacidad social (ocultar montos reales en grupos, mostrando solo porcentajes de avance).

- RNF-07 al RNF-09: Disponibilidad del 99.9%, sincronización de retos en menos de 5 segundos y gestión de concurrencia en aportes compartidos.

🧠 4. Diagramas UML

Diagrama de Casos de Uso: 
Muestra las interacciones del Usuario con los cuatro módulos principales del sistema: Gestión de Usuario, Gestión Financiera (ingresos/gastos), Presupuesto y Control, y el Componente Social/Gamificación.


Diagrama de Secuencia: 
Representa el flujo lógico del proceso de "Registro de gasto y actualización automática". Detalla cómo la interfaz envía los datos al sistema, este los guarda en la base de datos y procede a recalcular el balance y el progreso social antes de mostrar el resultado final al usuario.

🎨 5. URL del Prototipo
Puedes visualizar el diseño y flujo de la aplicación en el siguiente enlace de Figma:

[Prototipo NEXUS en Figma]
(https://www.figma.com/design/vOikeH4i155kMSD9jl2e3I/MockUp-NEXUS?node-id=164-2215&t=dYhND2QnIyu69BWL-1)

🗄️ 6. Diseño de Base de Datos

Agregar imagen del modelo.
Tablas principales

🧩 7. Documentación del Sistema
Estructura de Carpetas
/css
/js
/assets

Explicar brevemente qué contiene cada carpeta.

🚀 8. Instalación y Ejecución

Explicar cómo correr el proyecto.
