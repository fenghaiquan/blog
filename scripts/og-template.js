import satori from 'satori';

export function createOGTemplate({ title, description, date, siteName }) {
  const brand = siteName || "Feng's Blog";

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#FAF8F5',
        fontFamily: 'LXGW WenKai',
      },
      children: [
        // Left amber accent bar
        {
          type: 'div',
          props: {
            style: {
              width: '8px',
              background: '#92400E',
              flexShrink: 0,
            },
          },
        },
        // Main content area
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '100px 80px 60px 62px',
              position: 'relative',
            },
            children: [
              // Decorative circle (top-right, partially clipped)
              {
                type: 'svg',
                props: {
                  style: {
                    position: 'absolute',
                    top: '-60px',
                    right: '-60px',
                    width: '420px',
                    height: '420px',
                  },
                  children: [
                    {
                      type: 'circle',
                      props: {
                        cx: '210',
                        cy: '210',
                        r: '200',
                        fill: '#92400E',
                        opacity: '0.06',
                      },
                    },
                  ],
                },
              },
              // Text block — vertically centered
              {
                type: 'div',
                props: {
                  style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  },
                  children: [
                    // Title
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '56px',
                          fontWeight: 500,
                          lineHeight: 1.25,
                          color: '#1C1917',
                          maxWidth: '820px',
                        },
                        children: title,
                      },
                    },
                    // Description
                    description
                      ? {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '24px',
                              color: '#6B6560',
                              lineHeight: 1.5,
                              maxWidth: '760px',
                              marginTop: '20px',
                            },
                            children: description,
                          },
                        }
                      : null,
                  ].filter(Boolean),
                },
              },
              // Bottom bar
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #E7E5E4',
                    paddingTop: '24px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '28px',
                          fontWeight: 600,
                          color: '#92400E',
                        },
                        children: brand,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '22px',
                          color: '#78716C',
                        },
                        children: date,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function generateOGImage(element, fonts, width = 1200, height = 630) {
  const svg = await satori(element, {
    width,
    height,
    fonts,
  });
  return svg;
}
